import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, MoreVertical, Search, 
  Filter, AlertCircle, Loader2, Info 
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Button from './Button';

/**
 * 📊 Standardized Retro Table Component
 * Features: Responsive scroll, sticky header, loading states, empty states, and retro styling.
 */
export default function RetroTable({
  columns,
  data = [],
  isLoading = false,
  pagination = null,
  onRowClick,
  emptyMessage = "No data found",
  actions,
  className,
  containerClassName
}) {
  return (
    <div className={twMerge("space-y-4", containerClassName)}>
      {/* Table Container with Responsive Scroll */}
      <div className={twMerge(
        "retro-card bg-base-white border-4 border-base-black overflow-hidden relative",
        className
      )}>
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-base-cream/40 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-retro-orange animate-spin" />
              <p className="font-retro-mono text-[10px] text-base-black font-black uppercase tracking-widest">Syncing Data...</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto scrollbar-retro">
          <table className="w-full text-left border-collapse">
            {/* Sticky Header */}
            <thead className="bg-base-gray/30 border-b-4 border-base-black">
              <tr>
                {columns.map((col, i) => (
                  <th 
                    key={i}
                    className={twMerge(
                      "px-4 py-3 font-retro-display font-black text-[10px] md:text-xs uppercase tracking-wider text-base-black whitespace-nowrap",
                      col.className
                    )}
                    style={{ width: col.width }}
                  >
                    <div className="flex items-center gap-2">
                      {col.header}
                      {col.sortable && <Filter className="w-3 h-3 text-base-black/30" />}
                    </div>
                  </th>
                ))}
                {actions && (
                  <th className="px-4 py-3 font-retro-display font-black text-[10px] md:text-xs uppercase tracking-wider text-base-black w-20 text-center">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y-2 divide-base-black/5">
              {!isLoading && data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-retro bg-base-gray/20 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-base-black/20" />
                      </div>
                      <p className="font-retro-mono text-sm text-base-black/50">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <motion.tr 
                    key={row.id || rowIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: rowIndex * 0.03 }}
                    onClick={() => onRowClick?.(row)}
                    className={twMerge(
                      "group hover:bg-retro-yellow/5 transition-colors duration-150 cursor-default",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col, colIndex) => (
                      <td 
                        key={colIndex}
                        className={twMerge(
                          "px-4 py-3 font-retro-mono text-xs text-base-black/80",
                          col.className
                        )}
                      >
                        {col.render ? col.render(
                          col.key?.includes('.') 
                            ? col.key.split('.').reduce((obj, key) => obj?.[key], row)
                            : row[col.key], 
                          row
                        ) : (
                          col.key?.includes('.') 
                            ? col.key.split('.').reduce((obj, key) => obj?.[key], row)
                            : row[col.key]
                        )}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}

              {/* Skeleton Rows while loading initial data */}
              {isLoading && data.length === 0 && (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-base-gray/20 rounded-sm w-full" />
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-4">
                        <div className="h-4 bg-base-gray/20 rounded-sm w-12 mx-auto" />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Scroll Hint for Mobile */}
        <div className="lg:hidden h-1 bg-gradient-to-r from-retro-orange to-transparent opacity-20" />
      </div>

      {/* Pagination Controls */}
      {pagination && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <p className="font-retro-mono text-[10px] text-base-black/50 uppercase tracking-widest">
            Showing <span className="text-base-black font-black">{pagination.from || 0}</span> to <span className="text-base-black font-black">{pagination.to || 0}</span> of <span className="text-base-black font-black">{pagination.total || 0}</span> entries
          </p>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!pagination.prev_page_url || isLoading}
              onClick={() => pagination.onPageChange(pagination.current_page - 1)}
              className="px-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, pagination.last_page || 1))].map((_, i) => {
                const pageNum = i + 1; // Simplified pagination logic for demo
                return (
                  <Button 
                    key={pageNum}
                    variant={pagination.current_page === pageNum ? 'primary' : 'outline'}
                    size="sm"
                    className="w-8 h-8 px-0"
                    onClick={() => pagination.onPageChange(pageNum)}
                    disabled={isLoading}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              disabled={!pagination.next_page_url || isLoading}
              onClick={() => pagination.onPageChange(pagination.current_page + 1)}
              className="px-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 🏷️ Table Action Buttons
 * Common action combinations for retro tables
 */
export function TableActions({ 
  onView, 
  onEdit, 
  onDelete, 
  onReset,
  onMore, 
  moreIcon: MoreIcon = MoreVertical 
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      {onView && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="w-8 h-8 p-0 border-2 border-base-black hover:bg-retro-yellow transition-all"
          title="View Details"
        >
          <Search className="w-3.5 h-3.5" />
        </Button>
      )}
      {onReset && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onReset(); }}
          className="w-8 h-8 p-0 border-2 border-base-black hover:bg-retro-blue hover:text-white transition-all"
          title="Reset Password"
        >
          <Info className="w-3.5 h-3.5" />
        </Button>
      )}
      {onEdit && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="w-8 h-8 p-0 border-2 border-base-black hover:bg-retro-orange hover:text-white transition-all"
          title="Edit"
        >
          <Filter className="w-3.5 h-3.5" />
        </Button>
      )}
      {onDelete && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-8 h-8 p-0 border-2 border-base-black hover:bg-danger hover:text-white transition-all"
          title="Delete"
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </Button>
      )}
      {onMore && (
        <div className="relative group">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-8 h-8 p-0 border-2 border-base-black hover:bg-base-gray transition-all"
          >
            <MoreIcon className="w-3.5 h-3.5" />
          </Button>
          <div className="absolute right-0 top-full mt-1 w-40 retro-card p-2 space-y-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-30 bg-base-white border-2 border-base-black shadow-hard scale-95 group-hover:scale-100 origin-top-right">
            {onMore()}
          </div>
        </div>
      )}
    </div>
  );
}
