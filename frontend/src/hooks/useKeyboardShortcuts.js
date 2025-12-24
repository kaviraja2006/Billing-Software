import { useEffect } from 'react';

const useKeyboardShortcuts = (keyMap) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Check if input is focused (ignore keys if typing in input, unless it's a function key)
            const tagName = document.activeElement.tagName.toLowerCase();
            const isInputFocused = tagName === 'input' || tagName === 'textarea';

            // Allow F-keys even in inputs, but prevent default browser behavior
            if (event.key.startsWith('F') || (event.ctrlKey && ['p', 'm', 't', 'w'].includes(event.key.toLowerCase()))) {
                event.preventDefault();
            } else if (isInputFocused) {
                // If typing in input and not a special hotkey, let it behave normally.
                return;
            }

            // Construct key identifier (e.g., "Ctrl+S", "F2", "Enter")
            let key = event.key;
            if (event.ctrlKey && key !== 'Control') key = `Ctrl+${key.toUpperCase()}`;
            if (event.altKey && key !== 'Alt') key = `Alt+${key.toUpperCase()}`;
            if (event.shiftKey && key !== 'Shift') key = `Shift+${key.toUpperCase()}`;

            // Check match
            const handler = keyMap[key] || keyMap[event.key]; // Check composite or simple key
            if (handler) {
                handler(event);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [keyMap]);
};

export default useKeyboardShortcuts;
