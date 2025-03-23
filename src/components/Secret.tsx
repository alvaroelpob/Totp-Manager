import React, { useEffect, useState } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import SecretContextMenu from './SecretContextMenu';
import Notification from './Notification';

/* Styles */
import styles from '../assets/css/modules/Secret.module.css';

/* Utils */
import generateOTP from '../utils/generateOTP';
import storage from '../utils/storage';

/* Types */
import { NotificationState } from '../types/types';
import { SecretI } from '../types/types';

interface SecretProps {
    secret: SecretI,
    secrets: SecretI[],
    setSecrets: React.Dispatch<React.SetStateAction<SecretI[]>>,
    folders: string[],
}

interface MenuPosition {
    x: number;
    y: number;
}

export default function Secret({ secret, secrets, setSecrets, folders }: SecretProps) {
    const [otp, setOtp] = useState('...');
    const [progress, setProgress] = useState(50);
    const [currentSecond, setCurrentSecond] = useState(30);
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [contextMenu, setContextMenu] = useState<MenuPosition | null>(null);

    const updateOTP = async () => {
        const token = generateOTP(secret.secret);
        setOtp(token);
    };

    const updateProgress = () => {
        const epoch = Math.floor(Date.now() / 1000);
        const elapsedSeconds = epoch % 30;

        const progressValue = (elapsedSeconds / 30) * 100;

        setProgress(100 - progressValue);
        setCurrentSecond(30 - elapsedSeconds);

        if (elapsedSeconds === 0) {
            updateOTP();
        }
    };

    useEffect(() => {
        updateOTP();
        const interval = setInterval(updateProgress, 100);
        return () => clearInterval(interval);
    }, []);

    const copyKey = async () => {
        try {
            await writeText(otp);
            setNotification({
                message: 'Code copied to clipboard',
                type: 'success'
            });
        } catch (error) {
            setNotification({
                message: 'Failed to copy code: ' + (error instanceof Error ? error.message : String(error)),
                type: 'error'
            });
        }
    };

    const moveToFolder = async (targetFolder: string) => {
        const updatedSecrets = secrets.map(s =>
            s.name === secret.name ? { folder: targetFolder, ...s } : s
        );

        try {
            await storage.save(updatedSecrets);
            setSecrets(updatedSecrets);
            setNotification({
                message: 'Secret moved successfully',
                type: 'success'
            });
        } catch (error) {
            setNotification({
                message: 'Failed to move secret: ' + (error instanceof Error ? error.message : String(error)),
                type: 'error'
            });
        }
    };

    return (
        <>
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
            <div className={styles["totp-card"]}>
                <span className={styles["totp-name"]}>{secret.name}</span>
                <span className={styles["totp-code"]} onClick={copyKey}>{otp === "..." ? otp : otp.slice(0, 3) + " " + otp.slice(3)}</span>
                <div className={styles["totp-meta"]}>
                    <span className={styles["totp-folder"]}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 6h5l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
                        </svg> PERSONAL</span>
                    <div className={styles["totp-timer"]}>
                        <span>{currentSecond}s</span>
                        <div className={styles["timer-bar"]}>
                            <div className={styles["timer-progress"]} style={{ width: progress + "%" }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {contextMenu && (
                <SecretContextMenu
                    position={contextMenu}
                    onClose={() => setContextMenu(null)}
                    folders={folders}
                    currentFolder={secret.folder}
                    onFolderSelect={moveToFolder}
                />
            )}
        </>
    );
}

// const deleteSecret = async () => {
//     const newSecrets = secrets.filter(s => s.name !== secret.name);
//     try {
//         await storage.save(newSecrets);
//         setSecrets(newSecrets);
//         setNotification({
//             message: 'Secret deleted successfully',
//             type: 'success'
//         });
//     } catch (error) {
//         setNotification({
//             message: 'Failed to delete secret: ' + (error instanceof Error ? error.message : String(error)),
//             type: 'error'
//         });
//     }
// };

// const handleContextMenu = (e: React.MouseEvent) => {
//     e.preventDefault();
//     // Close any existing context menu
//     const event = new CustomEvent('closeSecretContextMenu');
//     document.dispatchEvent(event);
//     // Open new context menu
//     setContextMenu({ x: e.clientX, y: e.clientY });
// };
