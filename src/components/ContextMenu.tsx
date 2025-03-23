import React, { useEffect } from 'react';
import styles from '../assets/css/modules/ContextMenu.module.css';

interface Position {
    x: number;
    y: number;
}

interface ContextMenuProps {
    position: Position | null;
    onClose: () => void;
    onDelete: () => void;
}

export default function ContextMenu({ position, onClose, onDelete }: ContextMenuProps) {
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const menu = e.target as Node;
            const menuContainer = document.querySelector(`.${styles.menu}`);
            if (menuContainer && !menuContainer.contains(menu)) {
                onClose();
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [onClose]);

    if (!position) return null;

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
        onClose();
    };

    return (
        <div
            className={styles.menu}
            style={{ top: position.y, left: position.x }}
            onClick={e => e.stopPropagation()}
        >
            <div className={styles.header}>
                Folder actions
            </div>
            <button
                className={styles.item}
                onClick={handleDelete}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2b3d'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                Delete folder
            </button>
        </div>
    );
};
