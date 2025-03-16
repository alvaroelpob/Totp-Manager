import { useState } from 'react';
import styles from '../assets/css/modules/Add.module.css';
import { NotificationState, SecretI } from '../types/types';
import storage from '../utils/storage';

interface Props {
    setNotification: (notification: NotificationState | null) => void;
    secrets: SecretI[];
    setSecrets: React.Dispatch<React.SetStateAction<SecretI[]>>;
    selectedFolder: string;
}

export default function Add({ setNotification, secrets, setSecrets, selectedFolder }: Props) {
    const [name, setName] = useState("");
    const [otpSecret, setOtpSecret] = useState("");
    const [isVisible, setIsVisible] = useState(false);

    const addSecret = async () => {
        if (!name || !otpSecret) {
            setNotification({
                message: 'Please fill in all fields',
                type: 'error'
            });
            return;
        }

        if (secrets.find((key: { name: string; }) => key.name === name)) {
            setNotification({
                message: 'A secret with this name already exists',
                type: 'error'
            });
            return;
        }

        const newSecrets: SecretI[] = [{
            name,
            secret: otpSecret,
            folder: selectedFolder === 'All secrets' ? '' : selectedFolder
        }, ...secrets];

        try {
            await storage.save(newSecrets);
            setSecrets(newSecrets);
            setName('');
            setOtpSecret('');
            setIsVisible(false);
            setNotification({
                message: 'Secret added successfully',
                type: 'success'
            });
        } catch (error) {
            setNotification({
                message: 'Failed to save secret: ' + (error instanceof Error ? error.message : String(error)),
                type: 'error'
            });
        }
    };

    return (
        <div className={styles["add-container"]}>
            <button
                className={`${styles["toggle-button"]} ${isVisible ? styles["toggle-button-active"] : styles["toggle-button-inactive"]}`}
                onClick={() => setIsVisible(!isVisible)}
            >
                {isVisible ? '− Hide' : '+ Add Key'}
            </button>

            {isVisible && (
                <div className={styles["add-item"]}>
                    <input
                        type="text"
                        className={styles["input"]}
                        placeholder="Enter Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <input
                        type="text"
                        className={styles["input"]}
                        placeholder="Enter OTP Secret"
                        value={otpSecret}
                        onChange={(e) => setOtpSecret(e.target.value)}
                    />

                    <div className={styles["button-container"]}>
                        <button
                            className={styles["add-key-button"]}
                            onClick={addSecret}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            Add Key
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}