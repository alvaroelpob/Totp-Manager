import { useState, useEffect } from 'react';
import storage from './../utils/storage';

/* Styles */
import styles from '../assets/css/modules/Manager.module.css';

/* Icons */
import Plus from "./../assets/icons/plus.svg";
import Gear from "./../assets/icons/gear.svg";
import folder from "./../assets/icons/folder.svg";


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
    const [folders, setFolders] = useState<string[]>(['All']);
    const [selectedFolder, setSelectedFolder] = useState('All');
    const [newFolder, setNewFolder] = useState("");
    const [isInitialized, setIsInitialized] = useState(false);
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [contextMenu, setContextMenu] = useState<{ position: MenuPosition; folder: string } | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newEntry, setNewEntry] = useState({ name: '', secret: '', folder: '' });

    useEffect(() => {
        (async () => {
            const data = await storage.get();
            if (data) {
                setSecrets(data);
                const folderList = await storage.getFolders();
                setFolders(['All', ...folderList.filter(f => f !== 'All')]);
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

        if (newFolder.toLowerCase() === 'All' || folders.includes(newFolder)) {
            setNotification({
                message: 'This folder already exists',
                type: 'error'
            });
            return;
        }

        setFolders(['All', ...folders.filter(f => f !== 'All'), newFolder]);
        setSelectedFolder(newFolder);
        setNewFolder('');
    };

    const deleteFolder = async (folderToDelete: string) => {
        // Don't allow deletion of 'All' folder
        if (folderToDelete === 'All') {
            setNotification({
                message: 'Cannot delete this folder',
                type: 'error'
            });
            return;
        }

        // Remove folder from secrets that use it (they'll appear in 'All')
        const updatedSecrets = secrets.map(secret =>
            secret.folder === folderToDelete ? { ...secret, folder: '' } : secret
        );

        try {
            await storage.save(updatedSecrets);
            setSecrets(updatedSecrets);
            setFolders(folders.filter(f => f !== folderToDelete));

            if (selectedFolder === folderToDelete) {
                setSelectedFolder('All');
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

    const filteredSecrets = selectedFolder === 'All' ? secrets : secrets.filter(secret => secret.folder === selectedFolder);

    const logout = () => {
        storage.setPassword(null);
        setShowPassword(true);
    };

    return (
        <div className={styles.container} onContextMenu={(e) => handleContextMenu(e, selectedFolder)}>
            {/* <Settings
                secrets={secrets}
                setSecrets={setSecrets}
                setFolders={setFolders}
                setNotification={setNotification}
                onLogout={logout}
            /> */}

            <header className="header">
                <h1>TOTP Manager</h1>
                <div className="header-actions">
                    <button className="icon-button" onClick={() => { }}>
                        <img src={folder} alt="Settings" />
                    </button>
                    <button className="icon-button" onClick={() => { }}>
                        <img src={Gear} alt="Settings" />
                    </button>
                    <button className="add-button" onClick={() => { setShowAddDialog(true) }}>
                        <img src={Plus} alt="Settings" />
                        Add TOTP
                    </button>
                </div>
            </header>

            {showAddDialog && (
                <div className="dialog-overlay">
                    <div className="dialog">
                        <div className="dialog-header">
                            <h3>Add New TOTP</h3>
                            <button className="close-button" onClick={() => setShowAddDialog(false)}>
                                ×
                            </button>
                        </div>
                        <div className="dialog-content">
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="e.g. Google Account"
                                    value={newEntry.name}
                                    onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="secret">Secret Key</label>
                                <input
                                    id="secret"
                                    type="text"
                                    placeholder="Enter TOTP secret"
                                    value={newEntry.secret}
                                    onChange={(e) => setNewEntry({ ...newEntry, secret: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="folder">Folder</label>
                                <select
                                    id="folder"
                                    value={newEntry.folder}
                                    onChange={(e) => setNewEntry({ ...newEntry, folder: e.target.value })}
                                >
                                    {folders
                                        .filter((f) => f !== "All")
                                        .map((folder) => (
                                            <option key={folder} value={folder}>
                                                {folder}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <button className="primary-button" onClick={addFolder}>
                                Add TOTP
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            <div className={styles["folders-bar"]}>
                <div
                    className={styles["folders-list"]}
                    onWheel={(e) => {
                        if (e.deltaY !== 0) {
                            e.preventDefault();
                            e.currentTarget.scrollLeft += e.deltaY;
                        }
                    }}
                >
                    {folders.map(folder => (
                        <button
                            key={folder}
                            className={`${styles["folder-button"]} ${selectedFolder === folder ? styles["selected"] : ""}`}
                            onClick={() => setSelectedFolder(folder)}
                            onContextMenu={(e) => handleContextMenu(e, folder)}
                        >
                            {folder}
                        </button>
                    ))}
                </div>
                {/* <div className={styles["folder-controls"]}>
                    <Add setNotification={setNotification} secrets={secrets} setSecrets={setSecrets} selectedFolder={selectedFolder} />
                    <div className={styles["new-folder-compact"]}>
                        <input
                            type="text"
                            className={styles["folder-input"]}
                            placeholder="New Folder"
                            value={newFolder}
                            onChange={(e) => setNewFolder(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addFolder()}
                        />
                        <button onClick={addFolder}>+</button>
                    </div>
                </div> */}
            </div>

            <h2>{selectedFolder.replace("secrets", "")} TOTPs</h2>

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
        </div>
    );
}
