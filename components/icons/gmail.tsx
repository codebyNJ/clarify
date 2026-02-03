import * as React from "react";

export default function GmailIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path fill="currentColor" d="M502.3 190.8c-.5-6.1-3.4-11.8-8.1-15.9L268.7 8.6c-7.8-6.4-19-6.4-26.8 0L17.8 174.9c-4.7 3.9-7.6 9.6-8.1 15.8C9.2 189.1 8 205 8 224v216c0 22.1 17.9 40 40 40h104c22.1 0 40-17.9 40-40V328h128v112c0 22.1 17.9 40 40 40h104c22.1 0 40-17.9 40-40V224c0-19-.9-35-1.7-33.2zM256 72.1 448 224v216H344V328c0-22.1-17.9-40-40-40H208c-22.1 0-40 17.9-40 40v112H64V224L256 72.1z"/>
    </svg>
  );
}
