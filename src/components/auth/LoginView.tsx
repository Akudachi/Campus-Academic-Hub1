import React from 'react';
import { LoginPage } from './LoginPage';
import { useAuth } from '../../context/AuthContext';

interface LoginViewProps {
  onClose?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onClose }) => {
  return <LoginPage isModal={true} onSuccess={onClose} />;
};

