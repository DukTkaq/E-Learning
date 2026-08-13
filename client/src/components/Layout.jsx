import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen font-inter bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      {/* Footer Placeholder for future */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-gray-500 text-sm mt-auto">
        &copy; {new Date().getFullYear()} E-Learning Platform. All rights reserved.
      </footer>
    </div>
  );
}
