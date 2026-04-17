import React, { type ReactNode } from 'react';
import { ScreenHeader } from './ScreenHeader';

type BackHeaderProps = {
  title: string;
  rightElement?: ReactNode;
  onBack?: () => void;
};

export function BackHeader({ title, rightElement, onBack }: BackHeaderProps) {
  return <ScreenHeader title={title} rightElement={rightElement} onBack={onBack} />;
}
