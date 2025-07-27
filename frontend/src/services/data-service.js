import api from "../api/api";

function getClasses() {
    return api.get('/data');
}

function getGPA() {
    return api.get('/data/gpa');
}

function addClass(classData) {
    return api.post('/data', classData);
}

function updateClass(id, classData) {
    return api.put(`/data/${id}`, classData);
}

function deleteClass(id) {
    return api.delete(`/data/${id}`);
}

export const dataService = {
    getClasses,
    getGPA,
    addClass,
    updateClass,
    deleteClass
};

export default dataService;