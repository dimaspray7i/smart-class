import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Star } from "lucide-react"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

const contentVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9, 
    rotate: -3,
    x: "-50%",
    y: "-40%" 
  },
  visible: { 
    opacity: 1, 
    scale: 1, 
    rotate: 0,
    x: "-50%",
    y: "-50%",
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 25,
      mass: 0.1 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    rotate: 3,
    x: "-50%",
    y: "-45%",
    transition: { duration: 0.15 }
  }
};

const stickerVariants = {
  hidden: { scale: 0, rotate: -180, opacity: 0 },
  visible: { 
    scale: 1, 
    rotate: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 10, delay: 0.3 }
  },
  hover: { 
    scale: 1.15, 
    rotate: [0, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 }
  }
};

// ═══════════════════════════════════════════════════════════
// 🎭 RETRO DECORATIVE COMPONENTS
// ═══════════════════════════════════════════════════════════

// Floating Stars for Modal
function ModalDecorations() {
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:block"
          style={{
            top: `${10 + i * 25}%`,
            right: `${5 + i * 8}%`,
          }}
          animate={{
            y: [0, -8, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        >
          <Star className="w-4 h-4 text-retro-yellow fill-retro-yellow drop-shadow-retro" />
        </motion.div>
      ))}
    </>
  );
}

// Retro Close Button
function RetroCloseButton({ className, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "absolute top-4 right-4 p-2 retro-btn retro-btn-sm rounded-retro border-2 border-base-black bg-base-white hover:bg-retro-yellow/20 transition-colors z-10",
        className
      )}
      {...props}
    >
      <X className="w-4 h-4 text-base-black" />
      <span className="sr-only">Close</span>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎯 MAIN RETRO MODAL COMPONENTS
// ═══════════════════════════════════════════════════════════

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <AnimatePresence>
    <DialogPrimitive.Overlay
      ref={ref}
      asChild
      forceMount
    >
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={cn(
          "fixed inset-0 z-50 bg-base-black/60 backdrop-blur-sm",
          className
        )}
        {...props}
      />
    </DialogPrimitive.Overlay>
  </AnimatePresence>
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, showSticker = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <AnimatePresence>
      <DialogPrimitive.Content
        ref={ref}
        asChild
        forceMount
      >
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed left-[50%] top-[50%] z-50 flex flex-col w-full max-h-[90vh] overflow-hidden gap-0 retro-card bg-base-white border-4 border-base-black p-0 shadow-[8px_8px_0px_0px_#111111] sm:rounded-retro-lg",
            className
          )}
          {...props}
        >
          {/* Decorative Elements */}
          <ModalDecorations />
          
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-retro-orange pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-retro-blue pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-retro-purple pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-retro-lime pointer-events-none" />
          
          {children}
          
          <DialogClose asChild>
            <RetroCloseButton />
          </DialogClose>
          
          {/* Decorative Sticker Badge */}
          {showSticker && (
            <motion.div 
              variants={stickerVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="absolute -top-3 -right-3 z-20"
            >
              <div className="retro-sticker bg-retro-yellow text-base-black text-[10px] px-3 py-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                RETRO
              </div>
            </motion.div>
          )}
        </motion.div>
      </DialogPrimitive.Content>
    </AnimatePresence>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left border-b-2 border-base-black/20 pb-4 mb-4", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t-2 border-base-black/20 pt-4 mt-4", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("retro-heading retro-heading-sm text-base-black", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("font-retro-mono text-sm text-base-black/70", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export default function Modal({ isOpen, onClose, title, size = 'md', children, showSticker = true }) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-[95vw]'
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={sizeClasses[size] || sizeClasses.md} showSticker={showSticker}>
        <div className="flex flex-col h-full max-h-[90vh]">
          {title && (
            <div className="px-6 pt-6">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}