import { createContext, useContext, useState } from "react";
import ConfirmationModal from "../components/ConfirmationModal";

const ConfirmationContext = createContext();

export function ConfirmationProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirmar",
    isDanger: false,
    onConfirm: () => {},
  });

  const confirm = ({
    title,
    description,
    confirmText = "Confirmar",
    isDanger = false,
    onConfirm,
  }) => {
    setModalState({
      isOpen: true,
      title,
      description,
      confirmText,
      isDanger,
      onConfirm: async () => {
        if (onConfirm) await onConfirm();
        setModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const close = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmationContext.Provider value={{ confirm, close }}>
      {children}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={close}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        description={modalState.description}
        confirmText={modalState.confirmText}
        isDanger={modalState.isDanger}
      />
    </ConfirmationContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmationProvider");
  }
  return context;
}
