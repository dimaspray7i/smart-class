export default function Footer() {
  return (
    <footer className="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-sm text-gray-600 dark:text-dark-muted">
          © {new Date().getFullYear()} RPL Smart. All rights reserved.
        </div>
      </div>
    </footer>
  );
}