<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\ClassModel;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class AttendanceExportService
{
    public function exportAttendance(int $userId, array $options): array
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return ['success' => false, 'message' => 'User tidak ditemukan.', 'code' => 'USER_NOT_FOUND'];
            }

            $startDate = null;
            $endDate = null;

            if (!empty($options['start_date']) && !empty($options['end_date'])) {
                $startDate = Carbon::parse($options['start_date'])->startOfDay();
                $endDate = Carbon::parse($options['end_date'])->endOfDay();
            } else {
                [$startDate, $endDate] = $this->resolvePeriodRange($options);
            }

            if (!$startDate || !$endDate) {
                return ['success' => false, 'message' => 'Periode export tidak valid.', 'code' => 'INVALID_PERIOD'];
            }

            $isAdmin = $user->hasRole('admin');
            $classId = !empty($options['class_id']) ? (int) $options['class_id'] : null;
            $subjectId = !empty($options['subject_id']) ? (int) $options['subject_id'] : null;
            $teacherFilter = !empty($options['teacher_id']) ? (int) $options['teacher_id'] : null;

            $allowedClassIds = $this->getAllowedClassIds($userId, $isAdmin);
            if ($classId !== null) {
                if (!$isAdmin && !in_array($classId, $allowedClassIds, true)) {
                    return ['success' => false, 'message' => 'Anda tidak memiliki akses ke kelas ini.', 'code' => 'ACCESS_DENIED'];
                }
                $allowedClassIds = [$classId];
            }

            if (empty($allowedClassIds)) {
                return ['success' => true, 'data' => [], 'file_content' => '', 'filename' => 'absensi_empty_' . now()->format('Ymd_His') . '.csv', 'content_type' => 'text/csv'];
            }

            $studentIds = DB::table('class_user')
                ->whereIn('class_id', $allowedClassIds)
                ->where('role_in_class', 'siswa')
                ->where('is_active', true)
                ->pluck('user_id')
                ->unique()
                ->toArray();

            $students = User::whereIn('id', $studentIds)
                ->orderBy('name')
                ->get(['id', 'name', 'email']);

            $attendanceQuery = Attendance::with(['user', 'session'])
                ->whereIn('user_id', $studentIds)
                ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
                ->whereNull('pkl_location_id');

            if ($subjectId) {
                $attendanceQuery->whereHas('session', fn($query) => $query->where('subject_id', $subjectId));
            }

            if (!$isAdmin || $classId !== null) {
                $attendanceQuery->whereHas('session', fn($query) => $query->whereIn('class_id', $allowedClassIds));
            }

            if ($teacherFilter) {
                $attendanceQuery->whereHas('session', fn($query) => $query->where('generated_by', $teacherFilter));
            }

            $attendances = $attendanceQuery->get();
            $class = $classId ? ClassModel::find($classId) : (count($allowedClassIds) === 1 ? ClassModel::find($allowedClassIds[0]) : null);
            $teacher = $isAdmin && $teacherFilter ? User::find($teacherFilter) : ($user->hasRole('guru') ? $user : null);

            $reportData = [
                'school_name' => config('app.name', 'RPL Smart Ecosystem'),
                'report_title' => 'Laporan Absensi Siswa',
                'class_name' => $class?->name ?? 'Semua Kelas',
                'subject_name' => $subjectId ? (optional($attendanceQuery->get()->first()?->session?->subject)?->name ?? 'Mata Pelajaran Terpilih') : 'Semua Mata Pelajaran',
                'teacher_name' => $teacher?->name ?? ($isAdmin ? 'Administrator' : 'Guru Terkait'),
                'generated_by' => $user->name,
                'generated_at' => Carbon::now()->locale('id')->isoFormat('D MMMM YYYY HH:mm'),
                'period_label' => $this->formatPeriodLabel($startDate, $endDate),
                'rows' => $this->buildAttendanceRows($students, $attendances, $startDate, $endDate),
            ];

            if ($options['format'] === 'csv') {
                $content = $this->makeCsvFile($reportData);
                $filename = $this->makeFilename('csv', $reportData['class_name'], $reportData['period_label']);
                return [
                    'success' => true,
                    'file_content' => $content,
                    'filename' => $filename,
                    'content_type' => 'text/csv; charset=UTF-8',
                ];
            }

            $content = $this->makeXlsxFile($reportData);
            $filename = $this->makeFilename('xlsx', $reportData['class_name'], $reportData['period_label']);

            return [
                'success' => true,
                'file_content' => $content,
                'filename' => $filename,
                'content_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ];

        } catch (Exception $e) {
            Log::error('AttendanceExportService::exportAttendance failed', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return ['success' => false, 'message' => 'Gagal export data absensi.', 'code' => 'EXPORT_FAILED'];
        }
    }

    protected function resolvePeriodRange(array $options): array
    {
        $now = Carbon::now();
        $type = $options['period_type'] ?? 'week';

        return match ($type) {
            'month' => [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfMonth(),
            ],
            'semester' => $this->resolveSemesterRange($now),
            'year' => [
                $now->copy()->startOfYear(),
                $now->copy()->endOfYear(),
            ],
            'custom' => [
                $now->copy()->startOfWeek(Carbon::MONDAY),
                $now->copy()->startOfWeek(Carbon::MONDAY)->addDays(5),
            ],
            default => [
                $now->copy()->startOfWeek(Carbon::MONDAY),
                $now->copy()->startOfWeek(Carbon::MONDAY)->addDays(5),
            ],
        };
    }

    protected function resolveSemesterRange(Carbon $date): array
    {
        if ($date->month <= 6) {
            return [
                $date->copy()->startOfYear(),
                $date->copy()->month(6)->endOfMonth(),
            ];
        }

        return [
            $date->copy()->month(7)->startOfMonth(),
            $date->copy()->endOfYear(),
        ];
    }

    protected function formatPeriodLabel(Carbon $startDate, Carbon $endDate): string
    {
        if ($startDate->isSameDay($endDate)) {
            return $startDate->isoFormat('D MMMM YYYY');
        }

        return $startDate->isoFormat('D MMMM YYYY') . ' - ' . $endDate->isoFormat('D MMMM YYYY');
    }

    protected function getAllowedClassIds(int $userId, bool $isAdmin): array
    {
        if ($isAdmin) {
            return DB::table('classes')
                ->where('is_active', true)
                ->pluck('id')
                ->toArray();
        }

        return DB::table('schedules')
            ->where('teacher_id', $userId)
            ->where('is_active', true)
            ->pluck('class_id')
            ->unique()
            ->toArray();
    }

    protected function buildAttendanceRows(Collection $students, Collection $attendances, Carbon $startDate, Carbon $endDate): array
    {
        $weekdayCodes = [1 => 'SENIN', 2 => 'SELASA', 3 => 'RABU', 4 => 'KAMIS', 5 => 'JUMAT', 6 => 'SABTU'];
        $attendancesByUser = $attendances->groupBy('user_id');

        $rows = [];

        foreach ($students as $index => $student) {
            $weekCells = [];
            $statusCounts = ['H' => 0, 'S' => 0, 'I' => 0, 'A' => 0];
            $dayByWeekday = [];

            foreach ($attendancesByUser->get($student->id, collect()) as $attendance) {
                $weekday = Carbon::parse($attendance->date)->dayOfWeekIso;
                if ($weekday > 6) {
                    continue;
                }

                $code = $this->mapStatusToCode($attendance->status);
                $dayByWeekday[$weekday][] = $code;
                if (isset($statusCounts[$code])) {
                    $statusCounts[$code]++;
                }
            }

            for ($weekday = 1; $weekday <= 6; $weekday++) {
                $weekCells[] = $this->formatWeekdayCell($dayByWeekday[$weekday] ?? []);
            }

            $rows[] = array_merge([
                $index + 1,
                $student->name,
            ], $weekCells, [
                $statusCounts['H'],
                $statusCounts['S'],
                $statusCounts['I'],
                $statusCounts['A'],
            ]);
        }

        return $rows;
    }

    protected function mapStatusToCode(string $status): string
    {
        return match (strtolower($status)) {
            'hadir', 'terlambat' => 'H',
            'sakit' => 'S',
            'izin' => 'I',
            'alpha' => 'A',
            default => 'A',
        };
    }

    protected function formatWeekdayCell(array $codes): string
    {
        if (empty($codes)) {
            return '-';
        }

        $counts = array_count_values($codes);
        if (count($counts) === 1) {
            return array_key_first($counts);
        }

        $segments = [];
        foreach ($counts as $code => $count) {
            $segments[] = $code . ($count > 1 ? $count : '');
        }

        return implode(', ', $segments);
    }

    protected function makeFilename(string $format, string $className, string $periodLabel): string
    {
        $safeClass = preg_replace('/[^A-Za-z0-9_-]/', '_', strtolower($className));
        $safeDate = preg_replace('/[^A-Za-z0-9_-]/', '_', strtolower($periodLabel));
        return sprintf('laporan_absensi_%s_%s.%s', $safeClass ?: 'kelas', $safeDate ?: now()->format('Ymd'), $format);
    }

    protected function makeCsvFile(array $reportData): string
    {
        $rows = [];
        $rows[] = ['LAPORAN ABSENSI SISWA'];
        $rows[] = ['Sekolah', $reportData['school_name']];
        $rows[] = ['Kelas', $reportData['class_name']];
        $rows[] = ['Mata Pelajaran', $reportData['subject_name']];
        $rows[] = ['Guru', $reportData['teacher_name']];
        $rows[] = ['Periode', $reportData['period_label']];
        $rows[] = ['Dibuat Oleh', $reportData['generated_by']];
        $rows[] = ['Dibuat Pada', $reportData['generated_at']];
        $rows[] = [];
        $rows[] = ['NO', 'NAMA SISWA', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'H', 'S', 'I', 'A'];

        $total = ['H' => 0, 'S' => 0, 'I' => 0, 'A' => 0];

        foreach ($reportData['rows'] as $row) {
            $rows[] = $row;
            $total['H'] += (int) ($row[8] ?? 0);
            $total['S'] += (int) ($row[9] ?? 0);
            $total['I'] += (int) ($row[10] ?? 0);
            $total['A'] += (int) ($row[11] ?? 0);
        }

        $rows[] = [];
        $rows[] = ['TOTAL', '', '', '', '', '', '', '', $total['H'], $total['S'], $total['I'], $total['A']];

        $csv = "\xEF\xBB\xBF";
        foreach ($rows as $row) {
            $escaped = array_map(fn($value) => '"' . str_replace('"', '""', (string) $value) . '"', $row);
            $csv .= implode(',', $escaped) . "\r\n";
        }

        return $csv;
    }

    protected function makeXlsxFile(array $reportData): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan Absensi');

        $sheet->mergeCells('A1:L1');
        $sheet->setCellValue('A1', strtoupper($reportData['school_name']));
        $sheet->mergeCells('A2:L2');
        $sheet->setCellValue('A2', $reportData['report_title']);
        $sheet->mergeCells('A4:B4');
        $sheet->setCellValue('A4', 'Kelas');
        $sheet->setCellValue('C4', $reportData['class_name']);
        $sheet->setCellValue('A5', 'Mata Pelajaran');
        $sheet->setCellValue('C5', $reportData['subject_name']);
        $sheet->setCellValue('A6', 'Guru');
        $sheet->setCellValue('C6', $reportData['teacher_name']);
        $sheet->setCellValue('A7', 'Periode');
        $sheet->setCellValue('C7', $reportData['period_label']);
        $sheet->setCellValue('A8', 'Dibuat Oleh');
        $sheet->setCellValue('C8', $reportData['generated_by']);
        $sheet->setCellValue('A9', 'Dibuat Pada');
        $sheet->setCellValue('C9', $reportData['generated_at']);

        $headerRow = 11;
        $sheet->fromArray(['NO', 'NAMA SISWA', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'H', 'S', 'I', 'A'], null, "A{$headerRow}");

        $rowPointer = $headerRow + 1;
        $totals = ['H' => 0, 'S' => 0, 'I' => 0, 'A' => 0];

        foreach ($reportData['rows'] as $row) {
            $sheet->fromArray($row, null, "A{$rowPointer}");
            $totals['H'] += (int) ($row[8] ?? 0);
            $totals['S'] += (int) ($row[9] ?? 0);
            $totals['I'] += (int) ($row[10] ?? 0);
            $totals['A'] += (int) ($row[11] ?? 0);
            $rowPointer++;
        }

        $totalRow = $rowPointer + 1;
        $sheet->fromArray(['TOTAL', '', '', '', '', '', '', '', $totals['H'], $totals['S'], $totals['I'], $totals['A']], null, "A{$totalRow}");

        $styleHeader = [
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF333399']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF000000']]],
        ];

        $sheet->getStyle("A{$headerRow}:L{$headerRow}")->applyFromArray($styleHeader);
        $sheet->getStyle("A1:L2")->getFont()->setBold(true);
        $sheet->getStyle('A1')->getFont()->setSize(16);
        $sheet->getStyle('A2')->getFont()->setSize(14);
        $sheet->getStyle('A4:C9')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        $sheet->freezePane("C{$headerRow}");

        $sheet->getColumnDimension('A')->setWidth(6);
        $sheet->getColumnDimension('B')->setWidth(32);
        foreach (range('C', 'H') as $column) {
            $sheet->getColumnDimension($column)->setWidth(14);
        }
        foreach (range('I', 'L') as $column) {
            $sheet->getColumnDimension($column)->setWidth(10);
        }

        $tableRange = "A{$headerRow}:L{$rowPointer}";
        $sheet->getStyle($tableRange)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        for ($row = $headerRow + 1; $row <= $rowPointer; $row++) {
            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:L{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF2F2F2');
            }
        }

        $writer = new Xlsx($spreadsheet);
        ob_start();
        $writer->save('php://output');
        return ob_get_clean();
    }
}
