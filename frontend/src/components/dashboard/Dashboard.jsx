import { useState, useEffect } from 'react';
import dataService from '../../services/data-service.js';
import ClassList from './ClassList.jsx';
import AddClass from './AddClass.jsx';

function Dashboard() {
    const [classes, setClasses] = useState([]);
    const [gpaData, setGpaData] = useState({ gpa: 0, totalCredits: 0});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [classesResponse, gpaResponse] = await Promise.all([
                dataService.getClasses(),
                dataService.getGPA()
            ]);

            setClasses(classesResponse.data);
            setGpaData(gpaResponse.data);
        } catch (error) {
            setError('Failed to load data');
            console.error('Error loading data: ', error);
        } finally {
            setLoading(false);
        }
    }

    function handleClassAdded(newClass) {
        setClasses(prevClasses => [newClass, ...prevClasses]);
        setShowAddForm(false);
        updateGPAOnly();
    }

    function handleClassUpdated(updatedClass) {
        setClasses(prevClasses => 
            prevClasses.map(course => 
                course.id === updatedClass.id ? updatedClass : course
            )
        );
        updateGPAOnly();
    }

    function handleClassDeleted(classId) {
        setClasses(prevClasses => prevClasses.filter(course => course.id !== classId));
        updateGPAOnly();
    }

    async function updateGPAOnly() {
        try {
            const gpaResponse = await dataService.getGPA();
            setGpaData(gpaResponse.data);
        } catch (error) {
            console.error('Error updating GPA: ', error);
        }
    }

    if (loading) {
        return <div className = "loading">Loading...</div>;
    }

    return (
        <div className = "dashboard">
            <div className = "dashboardHeader">
                <h1>GPA Tracker</h1>
                <div className = "gpaSummary">
                    <div className = "gpaCard">
                        <h3>Your GPA:</h3>
                        <div className = "gpa">{gpaData.gpa || 0}</div>
                    </div>
                    <div className = "gpaCard">
                        <h3>Your Total Credits:</h3>
                        <div className = "gpa">{gpaData.totalCredits || 0}</div>
                    </div>
                </div>
            </div>
            {error && <div className = "errorMessage">{error}</div>}

            <div className = "dashboardActions">
                <button onClick = {() => setShowAddForm(!showAddForm)} className = "btn btn-primary">
                    {showAddForm ? 'Cancel' : 'Add New Class'}
                </button>
            </div>

            {showAddForm && (
                <AddClass onClassAdded = {handleClassAdded} onCancel = {() => setShowAddForm(false)} />
            )}

            <ClassList classes = {classes} onClassUpdated = {handleClassUpdated} onClassDeleted = {handleClassDeleted}/>
        </div>
    )
}

export default Dashboard;