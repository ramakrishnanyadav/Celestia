"use client";

import React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;

export function AlertDialogOverlay({
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in ${className}`}
      {...props}
    />
  );
}

export function AlertDialogContent({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={`fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-[var(--canvas-card)] p-6 shadow-2xl border border-[var(--border-subtle)] duration-200 focus:outline-none ${className}`}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  );
}

export function AlertDialogHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col space-y-2 text-left mb-4 ${className}`}
      {...props}
    />
  );
}

export function AlertDialogTitle({
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={`text-lg font-bold text-[var(--ink-primary)] ${className}`}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={`text-sm text-[var(--ink-secondary)] ${className}`}
      {...props}
    />
  );
}

export function AlertDialogAction({
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-[var(--status-danger)] text-white hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-danger)] focus-visible:ring-offset-2 ${className}`}
      {...props}
    />
  );
}

export function AlertDialogCancel({
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-[var(--canvas-subtle)] text-[var(--ink-primary)] border border-[var(--border-subtle)] hover:bg-[var(--canvas-sunken)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2 ${className}`}
      {...props}
    />
  );
}

export function AlertDialogFooter({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 mt-6 gap-2 ${className}`}
      {...props}
    />
  );
}

