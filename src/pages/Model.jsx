// src/components/Modal.jsx
import React from 'react';
import './Modal.css'; // For basic modal styling

const Modal = ({ children, onClose }) => {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                {children}
            </div>
        </div>
    );
};

export default Modal;