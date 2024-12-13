import {useEffect, useState} from 'react';
import {
    Menu,
    MenuItem,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import AccessWindow from './AccessWindow.jsx';
import './StorageForm.css';

function StorageForm() {
    const [folders, setFolders] = useState([]);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isAccessWindowOpen, setIsAccessWindowOpen] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [folderStack, setFolderStack] = useState([null]);
    const [newFolderName, setNewFolderName] = useState('');
    const [openCreateFolderDialog, setOpenCreateFolderDialog] = useState(false);
    const [users, setUsers] = useState([]);

    const fetchFolderData = (folderId) => {
        const token = localStorage.getItem('token');
        fetch(`http://localhost:8080/api/storage${folderId ? `?id=${folderId}` : ''}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setFolders(data);
                setCurrentFolderId(folderId);
            })
            .catch((error) => console.error('Error fetching folder data:', error));
    };

    const fetchDownloadFile = (file) => {
        const token = localStorage.getItem('token');
        fetch(`http://localhost:8080/api/files/${file.id}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                link.remove();
            })
            .catch((error) => console.error('Error downloading file:', error));
    };

    const fetchDeleteFile = (file) => {
        const token = localStorage.getItem('token');
        fetch(`http://localhost:8080/api/files/${file.id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                fetchFolderData(file.folderId);
                return response.status;
            })
            .catch((error) => console.error('Error deleting file:', error));
    };

    useEffect(() => {
        handleUserInfo();
        fetchFolderData(null);
    }, []);

    const handleContextMenu = (event, file) => {
        event.preventDefault();
        setSelectedFile(file);
        setMenuAnchor(event.currentTarget);
    };

    const handleOpenMenu = () => {
        handleUsers(selectedFile.id);
    }

    const handleCloseMenu = () => {
        setMenuAnchor(null);
    };

    const handleShare = () => {
        setIsAccessWindowOpen(true); // Open access window
        handleCloseMenu();
    };

    const handleGrantAccess = () => {
    }

    const handleGoBack = () => {
        if (folderStack.length > 1) {
            const previousFolderId = folderStack[folderStack.length - 1];
            setFolderStack(folderStack.slice(0, -1));
            fetchFolderData(previousFolderId);
        }
    };

    const handleNavigateToFolder = (folderId) => {
        setFolderStack([...folderStack, currentFolderId]);
        fetchFolderData(folderId);
    };

    const handleFileUpload = (event) => {
        const token = localStorage.getItem('token');
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('data', file);
            if (currentFolderId) {
                formData.append('folderId', currentFolderId);
            }
            fetch('http://localhost:8080/api/files', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })
                .then(() => {
                    fetchFolderData(currentFolderId);
                })
                .catch((error) => {
                    console.error('Error uploading file:', error);
                });
        }
    };

    const handleCreateFolder = () => {
        const token = localStorage.getItem('token');
        const body = {
            name: newFolderName,
            parentId: currentFolderId,
        };

        fetch('http://localhost:8080/api/folders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        })
            .then(() => fetchFolderData(currentFolderId))
            .then((data) => {
                console.log('Folder created:', data);
                setNewFolderName('');
                setOpenCreateFolderDialog(false);
                fetchFolderData(currentFolderId);
            })
            .catch((error) => {
                console.error('Error creating folder:', error);
            });
    };

    const handleOpenCreateFolderDialog = () => {
        setOpenCreateFolderDialog(true);
    };

    const handleCloseCreateFolderDialog = () => {
        setOpenCreateFolderDialog(false);
    };

    const handleUploadExcel = () => {
        const token = localStorage.getItem('token');

        fetch('http://localhost:8080/api/admin/export/xlsx', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch file');
                }
                return response.blob();
            })
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'database.xlsx';
                document.body.appendChild(link);
                link.click();
                link.remove();
            })
            .catch((error) => {
                console.error('Error downloading the file:', error);
            });
    };

    const handleUploadCsv = () => {
        const token = localStorage.getItem('token');

        fetch('http://localhost:8080/api/admin/export/csv', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch file');
                }
                return response.blob();
            })
            .then((blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'database.csv';
                document.body.appendChild(link);
                link.click();
                link.remove();
            })
            .catch((error) => {
                console.error('Error downloading the file:', error);
            });
    };

    const handleUsers = (fileId) => {
        const token = localStorage.getItem('token');

        fetch(`http://localhost:8080/api/users/${fileId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Server response was not OK');
                }
                return response.json();
            })
            .then((data) => {
                console.log('Fetched users:', data);

                setUsers(Array.isArray(data) ? data : []);
                if (!Array.isArray(data)) {
                    console.error('Server returned non-array data', data);
                }
            })
            .catch((error) => {
                console.error('Failed to fetch users', error);
            });
    };

    const clearStorageAndRefresh = () => {
        localStorage.removeItem('token');
        window.location.href = "/signin";
    };

    const handleUserInfo = () => {
        const token = localStorage.getItem('token');

        fetch(`http://localhost:8080/api/users/user`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }).then((response) => {
            if (!response.ok) {
                clearStorageAndRefresh();
            }
            return response.json();
        })
            .then(userData => {
                if (!userData) {
                    console.error('Server returned non-array data', userData);
                }
                setCurrentUser(userData);
                console.log(currentUser);
            })
    }

    return (
        <div className="storage-form">
            {/* Верхние кнопки */}
            <div className="storage-actions">
                <div>
                    <Button
                        variant="contained"
                        color="inherit"
                        onClick={handleGoBack}
                        disabled={folderStack.length <= 1}
                    >
                        Назад
                    </Button>
                </div>
                <div className="right-top-actions">
                    <Button
                        variant="contained"
                        component="label"
                        color="inherit"
                    >
                        Загрузить файл
                        <input type="file" hidden onChange={handleFileUpload}/>
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenCreateFolderDialog}
                    >
                        Создать папку
                    </Button>
                </div>
            </div>

            <div className="storage-files-container">
                {folders.map((file) => (
                    <div
                        key={file.id}
                        className={`storage-files-item ${
                            selectedFile?.id === file.id ? "selected" : ""
                        }`}
                        onContextMenu={(event) => handleContextMenu(event, file)}
                        onDoubleClick={() => handleNavigateToFolder(file.id)}
                    >
                        <div className="file-logo">
                            {file.isFile ? <DescriptionIcon/> : <FolderIcon/>}
                        </div>
                        <div className="file-name">{file.name}</div>
                    </div>
                ))}
            </div>

            {currentUser?.role === 'ROLE_ADMIN' && (
                <div className="storage-actions">
                    <div className="right-bottom-actions">
                        <Button variant="contained" color="inherit" onClick={handleUploadExcel}>
                            Excel
                        </Button>
                        <Button variant="contained" color="inherit" onClick={handleUploadCsv}>
                            CSV
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={openCreateFolderDialog} onClose={handleCloseCreateFolderDialog}>
                <DialogTitle>Создать новую папку</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Имя папки"
                        variant="outlined"
                        fullWidth
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreateFolderDialog} color="primary">
                        Закрыть
                    </Button>
                    <Button onClick={handleCreateFolder} color="primary">
                        Создать
                    </Button>
                </DialogActions>
            </Dialog>

            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClick={handleOpenMenu}
                onClose={handleCloseMenu}
                anchorOrigin={{vertical: "top", horizontal: "right"}}
                transformOrigin={{vertical: "top", horizontal: "left"}}
            >
                {selectedFile?.isFile && (
                    <MenuItem onClick={() => fetchDownloadFile(selectedFile)}>
                        Скачать
                    </MenuItem>
                )}
                {}
                <MenuItem onClick={() => fetchDeleteFile(selectedFile)}>Удалить</MenuItem>
                <MenuItem onClick={handleShare}>Доступ</MenuItem>
            </Menu>

            <AccessWindow
                open={isAccessWindowOpen}
                onClose={() => setIsAccessWindowOpen(false)}
                users={users}
                file={selectedFile}
                onGrantAccess={handleGrantAccess}
            />
        </div>
    );
}

export default StorageForm;
