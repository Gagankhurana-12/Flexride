import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  icon,
  className = '',
  ...props 
}, ref) => {
  const inputClasses = `
    block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
    focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 
    dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 
    dark:focus:border-blue-500 transition-colors duration-200
    ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
    ${icon ? 'pl-10' : ''}
    ${className}
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 dark:text-gray-500">
              {icon}
            </span>
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;