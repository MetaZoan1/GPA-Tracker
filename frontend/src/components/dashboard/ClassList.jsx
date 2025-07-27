import { useState } from 'react';
import { dataService } from '../../services/data-service.js';
import { toLetterGrade } from '../../utils/gradeUtils.js';
import DeleteClassPopUp from './DeleteClassPopUp.jsx';
import UpdateClass from './UpdateClass.jsx';

function ClassList({ classes, onClassUpdated, onClassDeleted }){
    const [updatingClass, setUpdatingClass] = useState(null);
    const [deletingClass, setDeletingClass] = useState(null);
    const [showDeleteConfirm, setShowDelete] = useState(false);
    const [classToDelete, setClassToDelete] = useState(null);

    function handleUpdate(classItem) {
        setUpdatingClass(classItem);
    }

    function handleDeleteClick(classItem) {
        setClassToDelete(classItem);
        setShowDelete(true);
    }

    async function handleDeleteConfirm() {
        if (!classToDelete) {
            return;
        }

        setShowDelete(false);
        setDeletingClass(classToDelete.id);

        try {
            await dataService.deleteClass(classToDelete.id);
            onClassDeleted(classToDelete.id);
        } catch (error) {
            console.error('Error deleting class: ', error);
            alert('Failed to delete class');
        } finally {
            setDeletingClass(null);
            setClassToDelete(null);
        }
    }

    function handleDeleteCancel() {
        setShowDelete(false);
        setClassToDelete(null);
    }

    function handleUpdateCompletion(updatedClass) {
        onClassUpdated(updatedClass);
        setUpdatingClass(null);
    }

    function handleUpdatingCancel() {
        setUpdatingClass(null);
    }

    if (classes.length === 0) {
        return (
            <div className = "noClasses">
                <p>You haven't added any classes yet. Add your first class to get started!</p>
            </div>
        )
    }

    return (
        <div className = "classList">
            <h3>Your Classes</h3>

            {updatingClass && <UpdateClass classData = {updatingClass} onUpdate = {handleUpdateCompletion} onCancel={handleUpdatingCancel}/>}

            <DeleteClassPopUp
                isOpen = {showDeleteConfirm}
                title = "Delete Class"
                message = {`Are you sure you want to delete ${classToDelete?.department} ${classToDelete?.classId}? This action cannot be undone.`}
                confirmText = "Delete"
                cancelText = "Cancel"
                onConfirm = {handleDeleteConfirm}
                onCancel = {handleDeleteCancel}
                isDestructive = {true}
            />

            <div className = "classesGrid">
                {classes.map(course => (
                    <div className = "classCard" key = {course.id}>
                        <div className = "classHeader">
                            <h4>{course.department} {course.classId}</h4>
                            <div className = "classActions">
                                <button
                                    onClick = {() => handleUpdate(course)}
                                    className = "btn btn-small btn-outline"
                                    disabled = {updatingClass?.id === course.id}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick = {() => handleDeleteClick(course)}
                                    className = "btn btn-small btn-danger"
                                    disabled = {deletingClass === course.id}
                                >
                                    {deletingClass === course.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>

                        <div className = "classDetails">
                            <div className = "classDetail">
                                <span className = "label">Grade:</span>
                                <span className = "value">{toLetterGrade(course.grade)}</span>
                            </div>
                            <div className = "classDetail">
                                <span className = "label">Credits:</span>
                                <span className = "value">{course.credits}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ClassList;