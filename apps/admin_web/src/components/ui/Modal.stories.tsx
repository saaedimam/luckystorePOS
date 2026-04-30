import React from 'react';
import { Modal } from './Modal';

export default {
  title: 'UI/Modal',
  component: Modal,
};

export const Default = () => (
  <Modal isOpen={true} onClose={() => {}} title="Sample Modal">
    <p>This is a modal content.</p>
  </Modal>
);
