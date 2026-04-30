import React from 'react';
import { Card } from './Card';

export default {
  title: 'UI/Card',
  component: Card,
};

export const Default = () => (
  <Card className="max-w-sm">
    <p>This is a card content.</p>
  </Card>
);
