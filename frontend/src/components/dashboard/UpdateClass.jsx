import { useState } from 'react';
import { dataService } from '../../services/data-service.js';
import { toGpa, toLetterGrade, getLetterGrades } from '../../utils/gradeUtils.js';

function UpdateClass({ classData, onUpdate, onCancel }) {
    const [formData, setData] = useState({
        department: classData.department,
        classId: classData.classId.toString(),
        letterGrade: toLetterGrade(classData.grade),
        credits: classData.credits.toString()
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const letterGrades = getLetterGrades();

    function handleChange(e){
        setData({...formData, [e.target.name]: e.target.value});
    }

    async function handleSubmit(e){
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const updateData = {
                department: formData.department,
                classId: parseInt(formData.classId),
                grade: toGpa(formData.letterGrade),
                credits: parseInt(formData.credits)
            };

            const response = await dataService.updateClass(classData.id, updateData);
            onUpdate(response.data);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to update class');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className = "updateClassForm">
            <div className = "updateClassUI">
                <h3>Update Class Info</h3>

                {error && <div className = "errorMessage">{error}</div>}

                <form onSubmit = {handleSubmit}>
                    <div className = "formRow">
                        <div className = "formGroup">
                            <label>Department</label>
                            <input 
                                type = "text"
                                name = "department"
                                value = {formData.department}
                                onChange = {handleChange}
                                maxLength = "4"
                                required
                                disabled = {loading}
                            />
                        </div>

                        <div className = "formGroup">
                            <label>Class ID</label>
                            <input 
                                type = "number"
                                name = "classId"
                                value = {formData.classId}
                                onChange = {handleChange}
                                required
                                disabled = {loading}
                            />
                        </div>

                        <div className = "formGroup">
                            <label>Grade</label>
                            <select
                                name = "letterGrade"
                                value = {formData.letterGrade}
                                onChange = {handleChange}
                                required
                                disabled = {loading}
                            >
                                <option value = "">Select Grade</option>
                                {letterGrades.map(grade => (
                                    <option key = {grade} value = {grade}>
                                        {grade}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className = "formGroup">
                            <label>Credits</label>
                            <input 
                                type = "number"
                                name = "credits"
                                value = {formData.credits}
                                onChange = {handleChange}
                                min = "1"
                                required
                                disabled = {loading}
                            />
                        </div>
                    </div>

                    <div className = "formActions">
                        <button type = "submit" disabled = {loading} className = "btn btn-primary">
                            {loading ? 'Updating...' : 'Update Class'}
                        </button>
                        <button type = "button" onClick = {onCancel} className = "btn btn-secondary">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default UpdateClass;