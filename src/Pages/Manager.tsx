import { useState, useEffect } from 'react';
import storage from './../utils/storage';

/* Styles */
import styles from '../assets/css/modules/Manager.module.css';

/* Components */
import Secret from './../components/Secret';
import Notification from './../components/Notification';
import Settings from './../components/Settings';
import ContextMenu from './../components/ContextMenu';

import { SecretI, NotificationState } from "./../types/types";
import Add from '../components/Add';

interface ManagerProps {
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}

interface MenuPosition {
    x: number;
    y: number;
}

export default function Manager({ setShowPassword }: ManagerProps) {
    const [secrets, setSecrets] = useState<SecretI[]>([]);
    const [folders, setFolders] = useState<string[]>(['All secrets']);
    const [selectedFolder, setSelectedFolder] = useState('All secrets');
    const [newFolder, setNewFolder] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [contextMenu, setContextMenu] = useState<{ position: MenuPosition; folder: string } | null>(null);

    useEffect(() => {
        (async () => {
            const data = await storage.get();
            if (data) {
                setSecrets(data);
                const folderList = await storage.getFolders();
                setFolders(['All secrets', ...folderList.filter(f => f !== 'All secrets')]);
                setIsInitialized(true);
            }
        })();
    }, []);



    const addFolder = async () => {
        if (!newFolder) {
            setNotification({
                message: 'Please enter a folder name',
                type: 'error'
            });
            return;
        }

        if (newFolder.toLowerCase() === 'all secrets' || folders.includes(newFolder)) {
            setNotification({
                message: 'This folder already exists',
                type: 'error'
            });
            return;
        }

        setFolders(['All secrets', ...folders.filter(f => f !== 'All secrets'), newFolder]);
        setSelectedFolder(newFolder);
        setNewFolder('');
    };

    const deleteFolder = async (folderToDelete: string) => {
        // Don't allow deletion of 'All secrets' folder
        if (folderToDelete === 'All secrets') {
            setNotification({
                message: 'Cannot delete this folder',
                type: 'error'
            });
            return;
        }

        // Remove folder from secrets that use it (they'll appear in 'All secrets')
        const updatedSecrets = secrets.map(secret =>
            secret.folder === folderToDelete ? { ...secret, folder: '' } : secret
        );

        try {
            await storage.save(updatedSecrets);
            setSecrets(updatedSecrets);
            setFolders(folders.filter(f => f !== folderToDelete));

            if (selectedFolder === folderToDelete) {
                setSelectedFolder('All secrets');
            }

            setNotification({
                message: 'Folder deleted successfully',
                type: 'success'
            });
        } catch (error) {
            setNotification({
                message: 'Failed to delete folder: ' + (error instanceof Error ? error.message : String(error)),
                type: 'error'
            });
        }
    };

    const handleContextMenu = (e: React.MouseEvent, folder: string) => {
        e.preventDefault();
        setContextMenu({
            position: { x: e.clientX, y: e.clientY },
            folder: folder
        });
    };

    const filteredSecrets = selectedFolder === 'All secrets' ? secrets : secrets.filter(secret => secret.folder === selectedFolder);

    // const logout = () => {
    //     storage.setPassword(null);
    //     setShowPassword(true);
    // };

    return (

        <div className={styles.container} onContextMenu={(e) => handleContextMenu(e, selectedFolder)}>
            <div className={styles["header-content"]}>
                <div className={styles["logo"]} data-text="TOTP Manager">
                    TOTP Manager
                </div>
                <button className={styles["add-button"]}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    ADD TOTP
                </button>
            </div>

            {
                notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )
            }

            <div className={styles["folders-bar"]}>
                <div className={styles["folder-nav"]}>
                    {folders.map(folder => (
                        <div
                            key={folder}
                            className={`${styles.folder} ${selectedFolder === folder ? styles.active : ""}`}
                            onClick={() => setSelectedFolder(folder)}
                            onContextMenu={(e) => handleContextMenu(e, folder)}
                        >
                            {folder}
                        </div>
                    ))}
                </div>
            </div>

            {contextMenu && (
                <ContextMenu
                    position={contextMenu.position}
                    onClose={() => setContextMenu(null)}
                    onDelete={() => deleteFolder(contextMenu.folder)}
                />
            )}

            <div className={styles["container-secrets"]}>
                {!isInitialized ? (
                    <p className={styles["stored-secrets-title"]}>
                        Loading secrets...
                    </p>
                ) : filteredSecrets.length === 0 ? (
                    <p
                        className={styles["stored-secrets-title"]}>
                        No stored secrets in this folder
                    </p>
                ) : (
                    <>
                        {filteredSecrets.map((secret) => (
                            <Secret
                                key={secret.name}
                                secret={secret}
                                secrets={secrets}
                                setSecrets={setSecrets}
                                folders={folders}
                            />
                        ))}
                    </>
                )}
            </div>
        </div >
    );
}
