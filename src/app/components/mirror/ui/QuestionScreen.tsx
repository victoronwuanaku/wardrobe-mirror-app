import React from 'react';

export function QuestionScreen({ title, subtitle, children, icon }: { title: string; subtitle?: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {icon && (
        <div className="flex justify-center mb-4 sm:mb-6">
          {icon}
        </div>
      )}
      <div className="text-center space-y-2 sm:space-y-3 px-4">
        <h2 className="text-serif-elegant text-light text-safe" style={{
          fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
          lineHeight: 1.3,
          fontWeight: 300
        }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-sans-clean text-light-muted text-safe" style={{
            fontSize: 'clamp(0.813rem, 3vw, 0.938rem)',
            lineHeight: 1.6,
            fontWeight: 300
          }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="space-y-3 sm:space-y-4">
        {children}
      </div>
    </div>
  );
}
