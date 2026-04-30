import React from 'react';
import { Badge } from './Badge';

export default {
  title: 'UI/Badge',
  component: Badge,
};

export const Variants = () => (
  <div className="space-x-2">
    <Badge variant="success">Success</Badge>
    <Badge variant="warning">Warning</Badge>
    <Badge variant="danger">Danger</Badge>
    <Badge variant="info">Info</Badge>
    <Badge variant="neutral">Neutral</Badge>
  </div>
);
