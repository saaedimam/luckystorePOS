import React from 'react';
import { Select } from './Select';

export default {
  title: 'UI/Select',
  component: Select,
};

export const Default = () => (
  <Select
    label="Category"
    value=""
    onChange={(val: string) => console.log(val)}
    options={[
      { label: 'All', value: '' },
      { label: 'Electronics', value: 'electronics' },
      { label: 'Clothing', value: 'clothing' },
    ]}
  />
);
