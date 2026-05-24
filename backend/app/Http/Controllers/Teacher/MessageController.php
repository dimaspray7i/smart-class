<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MessageController extends Controller
{
    /**
     * 💬 Get conversations list for the logged-in teacher.
     *  Returns the last message per unique contact (student/other teacher/admin).
     */
    public function conversations(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;

            // Get distinct contacts this teacher has messaged or received messages from
            $conversations = Message::where(function ($q) use ($teacherId) {
                    $q->where('sender_id', $teacherId)
                      ->orWhere('receiver_id', $teacherId);
                })
                ->with(['sender:id,name,role', 'receiver:id,name,role'])
                ->orderByDesc('created_at')
                ->get()
                ->groupBy(function ($msg) use ($teacherId) {
                    // Group by the OTHER party
                    return $msg->sender_id === $teacherId
                        ? $msg->receiver_id
                        : $msg->sender_id;
                })
                ->map(function ($msgs, $contactId) use ($teacherId) {
                    $latest  = $msgs->first(); // already sorted desc
                    $contact = $latest->sender_id === $teacherId
                        ? $latest->receiver
                        : $latest->sender;

                    $unread = $msgs->where('receiver_id', $teacherId)
                                   ->where('is_read', false)
                                   ->count();

                    return [
                        'id'              => (int) $contactId,
                        'name'            => $contact?->name ?? 'Pengguna',
                        'role'            => $contact?->role ?? '',
                        'last_message'    => $latest->content,
                        'last_message_at' => $latest->created_at,
                        'unread_count'    => $unread,
                        'online'          => false,
                    ];
                })
                ->values();

            return response()->json([
                'status'  => 'success',
                'message' => 'Daftar percakapan berhasil diambil.',
                'code'    => 'CONVERSATIONS_SUCCESS',
                'data'    => $conversations,
            ], 200);

        } catch (\Exception $e) {
            Log::error('MessageController::conversations failed', [
                'teacher_id' => $request->user()?->id,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal memuat percakapan.',
                'code'    => 'CONVERSATIONS_ERROR',
            ], 500);
        }
    }

    /**
     * 📨 Get messages for a specific contact/conversation.
     *  Marks messages from that contact as read.
     */
    public function show(Request $request, int $contactId): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;

            // Verify contact exists
            $contact = User::find($contactId);
            if (!$contact) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Kontak tidak ditemukan.',
                    'code'    => 'CONTACT_NOT_FOUND',
                ], 404);
            }

            // Mark incoming messages as read
            Message::where('sender_id', $contactId)
                   ->where('receiver_id', $teacherId)
                   ->where('is_read', false)
                   ->update(['is_read' => true]);

            // Fetch messages
            $messages = Message::where(function ($q) use ($teacherId, $contactId) {
                    $q->where('sender_id', $teacherId)->where('receiver_id', $contactId);
                })
                ->orWhere(function ($q) use ($teacherId, $contactId) {
                    $q->where('sender_id', $contactId)->where('receiver_id', $teacherId);
                })
                ->orderBy('created_at')
                ->get()
                ->map(fn($msg) => [
                    'id'          => $msg->id,
                    'sender_id'   => $msg->sender_id,
                    'receiver_id' => $msg->receiver_id,
                    'content'     => $msg->content,
                    'is_read'     => (bool) $msg->is_read,
                    'created_at'  => $msg->created_at,
                ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Pesan berhasil diambil.',
                'code'    => 'MESSAGES_SUCCESS',
                'data'    => $messages,
            ], 200);

        } catch (\Exception $e) {
            Log::error('MessageController::show failed', [
                'teacher_id' => $request->user()?->id,
                'contact_id' => $contactId,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal memuat pesan.',
                'code'    => 'MESSAGES_ERROR',
            ], 500);
        }
    }

    /**
     * ✉️ Send a new message.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'receiver_id' => 'required|integer|exists:users,id',
                'content'     => 'required|string|max:2000',
            ]);

            $senderId = $request->user()->id;

            if ((int) $validated['receiver_id'] === $senderId) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Tidak bisa mengirim pesan ke diri sendiri.',
                    'code'    => 'SELF_MESSAGE_NOT_ALLOWED',
                ], 422);
            }

            $message = Message::create([
                'sender_id'   => $senderId,
                'receiver_id' => $validated['receiver_id'],
                'content'     => $validated['content'],
                'is_read'     => false,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Pesan berhasil dikirim.',
                'code'    => 'MESSAGE_SENT',
                'data'    => [
                    'id'          => $message->id,
                    'sender_id'   => $message->sender_id,
                    'receiver_id' => $message->receiver_id,
                    'content'     => $message->content,
                    'is_read'     => false,
                    'created_at'  => $message->created_at,
                ],
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Validasi gagal.',
                'code'    => 'VALIDATION_ERROR',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('MessageController::store failed', [
                'teacher_id' => $request->user()?->id,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mengirim pesan.',
                'code'    => 'MESSAGE_SEND_ERROR',
            ], 500);
        }
    }
}
