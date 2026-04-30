import React from 'react';
import { Button } from './Button';

export default {
  title: 'UI/Button',
  component: Button,
};

export const Primary = () => <Button variant='primary'>Primary</Button>;
export const Secondary = () => <Button variant='secondary'>Secondary</Button>;
export const Tertiary = () => <Button variant='tertiary'>Tertiary</Button>;
export const Danger = () => <Button variant='danger'>Danger</Button>;
