import React, { createContext, useContext, useState } from 'react';

const RobertContext = createContext();

export const RobertProvider = ({ children }) => {
  const [activeField, setActiveField] = useState('landing');
  const [errorMessage, setErrorMessage] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [customSpeech, setCustomSpeech] = useState(null);

  const speak = (message) => {
    setCustomSpeech(message);
  };

  return (
    <RobertContext.Provider
      value={{
        activeField,
        setActiveField,
        errorMessage,
        setErrorMessage,
        role,
        setRole,
        customSpeech,
        setCustomSpeech,
        speak
      }}
    >
      {children}
    </RobertContext.Provider>
  );
};

export const useRobert = () => useContext(RobertContext);
