const firebaseConfig = {
    apiKey: "AIzaSyDVy16XZdGWZxxOYQQ1TFuIEu22uOhaTc4",
    authDomain: "finalproject-c037e.firebaseapp.com",
    projectId: "finalproject-c037e",
    storageBucket: "finalproject-c037e.firebasestorage.app",
    messagingSenderId: "294930330109",
    appId: "1:294930330109:web:8d06bbecbf790f558b2994"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const classId = localStorage.getItem('currentClassId');
if (!classId) {
    window.location.href = 'index.html';
}

let currentCheckinNo = null;
let qrcode = null;
let unsubscribeStudents = null;
let unsubscribeAnswers = null;

document.addEventListener('DOMContentLoaded', () => {
    loadClassInfo();
    loadCheckinHistory();
    initQRCode();
    
    document.getElementById('questionHistorySelect').addEventListener('change', function() {
        onQuestionSelect(this.value);
    });

    document.getElementById('editStudentForm').addEventListener('submit', updateStudent);
    
    document.getElementById('addStudentBtn').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('addStudentModal'));
        modal.show();
    });

    document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addNewStudent();
    });

    document.getElementById('showQRBtn').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('qrModal'));
        modal.show();
    });

    document.getElementById('showStudentsBtn').addEventListener('click', () => {
        const studentsList = document.getElementById('studentsList');
        studentsList.classList.toggle('hidden');
        if (!studentsList.classList.contains('hidden')) {
            loadStudents();
        }
    });

    document.getElementById('addCheckinBtn').addEventListener('click', createCheckin);
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('exitCheckinBtn').addEventListener('click', exitCheckin);
    document.getElementById('startCheckinBtn').addEventListener('click', startCheckin);
    document.getElementById('stopCheckinBtn').addEventListener('click', stopCheckin);
    document.getElementById('saveCheckinBtn').addEventListener('click', saveCheckin);
    document.getElementById('showCheckinCodeBtn').addEventListener('click', showCheckinCode);
    document.getElementById('showClassQRBtn').addEventListener('click', showClassQR);
    document.getElementById('questionAnswerBtn').addEventListener('click', toggleQuestionScreen);

    document.getElementById('startQuestionBtn').addEventListener('click', startQuestion);
    document.getElementById('stopQuestionBtn').addEventListener('click', stopQuestion);
});

function initQRCode() {
    if (!qrcode) {
        qrcode = new QRCode(document.getElementById("qrcode"), {
            text: classId,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

async function loadClassInfo() {
    try {
        const doc = await db.collection('classroom').doc(classId).get();
        const data = doc.data();
        
        document.getElementById('className').textContent = data.info.name;
        document.getElementById('classCode').textContent = `รหัสวิชา: ${data.info.code}`;
        document.getElementById('classRoom').textContent = `ห้องเรียน: ${data.info.room}`;
        document.getElementById('classPhoto').src = data.info.photo || 'https://via.placeholder.com/800x400';
    } catch (error) {
        console.error('Error loading class info:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูลห้องเรียน');
    }
}

async function loadStudents() {
    try {
        const snapshot = await db.collection('classroom').doc(classId)
            .collection('students').get();
        
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = '';
        
        snapshot.docs.forEach((doc, index) => {
            const student = doc.data();
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.stdid}</td>
                    <td><img src="${student.photo || 'https://via.placeholder.com/40'}" class="student-img"></td>
                    <td>${student.name}</td>
                    <td>${student.status === 1 ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" 
                                onclick="openEditStudentModal('${doc.id}')">
                            แก้ไข
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading students:', error);
        alert('เกิดข้อผิดพลาดในการโหลดรายชื่อนักเรียน');
    }
}

async function openEditStudentModal(studentUid) {
    try {
        const doc = await db.collection('classroom').doc(classId)
            .collection('students').doc(studentUid).get();
            
        if (doc.exists) {
            const student = doc.data();
            document.getElementById('editStudentUid').value = studentUid;
            document.getElementById('editStudentId').value = student.stdid;
            document.getElementById('editStudentName').value = student.name;
            document.getElementById('editStudentPhoto').value = student.photo || '';
            document.getElementById('editStudentStatus').value = student.status;
            
            const modal = new bootstrap.Modal(document.getElementById('editStudentModal'));
            modal.show();
        } else {
            alert('ไม่พบข้อมูลนักศึกษา');
        }
    } catch (error) {
        console.error('Error loading student data:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูลนักศึกษา');
    }
}

async function loadCheckinHistory() {
    try {
        const snapshot = await db.collection('classroom').doc(classId)
            .collection('checkin').orderBy('date', 'asc').get();
        
        const tbody = document.getElementById('checkinHistoryBody');
        tbody.innerHTML = '';
        
        snapshot.docs.forEach((doc, index) => {
            const checkin = doc.data();
            const statusText = ['ยังไม่เริ่ม', 'กำลังเช็คชื่อ', 'เสร็จแล้ว'][checkin.status];
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${checkin.date}</td>
                    <td>${checkin.totalStudents || 0}</td>
                    <td>${statusText}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" 
                                onclick="manageCheckin('${doc.id}')">
                            จัดการ
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading checkin history:', error);
        alert('เกิดข้อผิดพลาดในการโหลดประวัติการเช็คชื่อ');
    }
}

async function createCheckin() {
    try {
        const checkinRef = db.collection('classroom').doc(classId).collection('checkin');
        const snapshot = await checkinRef.orderBy('cno', 'desc').limit(1).get();
        
        let nextCno = 1;
        if (!snapshot.empty) {
            nextCno = snapshot.docs[0].data().cno + 1;
        }
        
        const now = new Date();
        const dateStr = now.toLocaleString('th-TH');
        
        await checkinRef.doc(nextCno.toString()).set({
            cno: nextCno,
            date: dateStr,
            status: 0,
            code: Math.random().toString(36).substr(2, 6).toUpperCase()
        });
        
        const studentsSnapshot = await db.collection('classroom').doc(classId)
            .collection('students').get();
        
        const batch = db.batch();
        studentsSnapshot.docs.forEach(doc => {
            const student = doc.data();
            const scoreRef = checkinRef.doc(nextCno.toString())
                .collection('scores').doc(student.stdid);
            batch.set(scoreRef, {
                uid: doc.id,
                name: student.name,
                status: 0,
                score: 0,
                remark: ''
            });
        });
        await batch.commit();
        
        loadCheckinHistory();
        alert('สร้างการเช็คชื่อใหม่เรียบร้อยแล้ว');
    } catch (error) {
        console.error('Error creating checkin:', error);
        alert('เกิดข้อผิดพลาดในการสร้างการเช็คชื่อ');
    }
}

async function manageCheckin(cno) {
    currentCheckinNo = cno;
    document.querySelector('.card.mb-4:has(#checkinHistoryBody)').classList.add('hidden');
    document.getElementById('checkinScreen').classList.remove('hidden');

    try {
        const checkinDoc = await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo).get();
        const checkinData = checkinDoc.data();
        
        if (checkinData && checkinData.date) {
            document.getElementById('checkinDateHeader').textContent = 
                `วันที่เช็คชื่อ: ${checkinData.date}`;
        }
    } catch (error) {
        console.error('Error fetching check-in date:', error);
    }

    loadCheckinStudents();
    setupRealtimeListeners();
}

async function loadCheckinStudents() {
    try {
        const snapshot = await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .collection('students').get();
        
        const tbody = document.getElementById('checkinTableBody');
        tbody.innerHTML = '';
        
        snapshot.docs.forEach((doc, index) => {
            const student = doc.data();
            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${student.stdid}</td>
                    <td>${student.name}</td>
                    <td>${student.remark || ''}</td>
                    <td>${student.date}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" 
                                onclick="deleteCheckinStudent('${doc.id}')">
                            ลบ
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading checkin students:', error);
        alert('เกิดข้อผิดพลาดในการโหลดรายชื่อนักเรียน');
    }
}

function setupRealtimeListeners() {
    if (unsubscribeStudents) unsubscribeStudents();
    if (unsubscribeAnswers) unsubscribeAnswers();

    unsubscribeStudents = db.collection('classroom').doc(classId)
        .collection('checkin').doc(currentCheckinNo)
        .collection('students')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    addStudentToTable(change.doc);
                } else if (change.type === 'removed') {
                    removeStudentFromTable(change.doc.id);
                }
            });
        });

    unsubscribeAnswers = db.collection('classroom').doc(classId)
        .collection('checkin').doc(currentCheckinNo)
        .collection('answers')
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    addAnswerToTable(change.doc);
                }
            });
        });
}

function addStudentToTable(doc) {
    const student = doc.data();
    const tbody = document.getElementById('checkinTableBody');
    const rowCount = tbody.childElementCount;
    
    const row = document.createElement('tr');
    row.id = `student-${doc.id}`;
    row.innerHTML = `
        <td>${rowCount + 1}</td>
        <td>${student.stdid}</td>
        <td>${student.name}</td>
        <td>${student.remark || ''}</td>
        <td>${student.date}</td>
        <td>
            <button class="btn btn-danger btn-sm" 
                    onclick="deleteCheckinStudent('${doc.id}')">
                ลบ
            </button>
        </td>
    `;
    tbody.appendChild(row);
}

function removeStudentFromTable(studentId) {
    const row = document.getElementById(`student-${studentId}`);
    if (row) row.remove();
}

async function deleteCheckinStudent(studentId) {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายชื่อนี้?')) return;
    
    try {
        await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .collection('students').doc(studentId).delete();
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('เกิดข้อผิดพลาดในการลบรายชื่อ');
    }
}

async function startCheckin() {
    try {
        await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .update({ status: 1 });
        alert('เปิดการเช็คชื่อแล้ว');
    } catch (error) {
        console.error('Error starting checkin:', error);
        alert('เกิดข้อผิดพลาดในการเปิดการเช็คชื่อ');
    }
}

async function stopCheckin() {
    try {
        await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .update({ status: 2 });
        alert('ปิดการเช็คชื่อแล้ว');
    } catch (error) {
        console.error('Error stopping checkin:', error);
        alert('เกิดข้อผิดพลาดในการปิดการเช็คชื่อ');
    }
}

async function saveCheckin() {
    try {
        const studentsSnapshot = await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .collection('students').get();
        
        const batch = db.batch();
        studentsSnapshot.docs.forEach(doc => {
            const student = doc.data();
            const scoreRef = db.collection('classroom').doc(classId)
                .collection('checkin').doc(currentCheckinNo)
                .collection('scores').doc(student.stdid);
            batch.set(scoreRef, {
                uid: doc.id,
                name: student.name,
                status: 1,
                score: 1,
                remark: student.remark || '',
                date: student.date
            });
        });
        await batch.commit();
        alert('บันทึกการเช็คชื่อเรียบร้อยแล้ว');
    } catch (error) {
        console.error('Error saving checkin:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกการเช็คชื่อ');
    }
}

async function showCheckinCode() {
    try {
        const doc = await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo).get();
        const code = doc.data().code;
        alert(`รหัสเช็คชื่อ: ${code}`);
    } catch (error) {
        console.error('Error showing checkin code:', error);
        alert('เกิดข้อผิดพลาดในการแสดงรหัสเช็คชื่อ');
    }
}

function showClassQR() {
    const modal = new bootstrap.Modal(document.getElementById('qrModal'));
    modal.show();
}

function exitCheckin() {
    document.getElementById('checkinScreen').classList.add('hidden');
    document.getElementById('questionScreen').classList.add('hidden');
    document.querySelector('.card.mb-4:has(#checkinHistoryBody)').classList.remove('hidden');
    document.getElementById('studentsList').classList.add('hidden');
    if (unsubscribeStudents) unsubscribeStudents();
    if (unsubscribeAnswers) unsubscribeAnswers();
    currentCheckinNo = null;
}

function toggleQuestionScreen() {
    const questionScreen = document.getElementById('questionScreen');
    questionScreen.classList.toggle('hidden');
    if (!questionScreen.classList.contains('hidden')) {
        loadCurrentQuestion();
        loadQuestionHistory();
    }
}

async function onQuestionSelect(questionNo) {
    if (!questionNo) {
        document.getElementById('answersTableBody').innerHTML = '';
        return;
    }
    
    try {
        const questionDoc = await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .collection('answers').doc(questionNo).get();
            
        if (questionDoc.exists) {
            const questionData = questionDoc.data();
            document.getElementById('questionNo').value = questionNo;
            document.getElementById('questionText').value = questionData.text || '';
            
            loadAnswers(questionNo);
        }
    } catch (error) {
        console.error('Error loading selected question:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อคำถามที่เลือก');
    }
}

async function loadCurrentQuestion() {
    try {
        const doc = await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo).get();
        const data = doc.data();
        
        if (data.question_no) {
            document.getElementById('questionNo').value = data.question_no;
            document.getElementById('questionText').value = data.question_text || '';
            
            const select = document.getElementById('questionHistorySelect');
            if (select) {
                setTimeout(() => {
                    select.value = data.question_no;
                }, 500); 
            }
        }
        
        loadAnswers(data.question_no);
    } catch (error) {
        console.error('Error loading current question:', error);
        alert('เกิดข้อผิดพลาดในการโหลดคำถาม');
    }
}

async function startQuestion() {
    const questionNo = document.getElementById('questionNo').value;
    const questionText = document.getElementById('questionText').value;
    
    if (!questionNo || !questionText) {
        alert('กรุณากรอกข้อที่และคำถามให้ครบถ้วน');
        return;
    }
    
    try {
        await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .update({
                question_no: parseInt(questionNo),
                question_text: questionText,
                question_show: true
            });
        
        await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .collection('answers').doc(questionNo).set({
                text: questionText,
                students: {}
            });
            
        alert('เริ่มคำถามแล้ว');
        loadAnswers(questionNo);
    } catch (error) {
        console.error('Error starting question:', error);
        alert('เกิดข้อผิดพลาดในการเริ่มคำถาม');
    }
}

async function stopQuestion() {
    try {
        await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .update({
                question_show: false
            });
        alert('ปิดคำถามแล้ว');
    } catch (error) {
        console.error('Error stopping question:', error);
        alert('เกิดข้อผิดพลาดในการปิดคำถาม');
    }
}

async function loadAnswers(questionNo) {
    if (!questionNo) return;
    
    try {
        const snapshot = await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .collection('answers').doc(questionNo)
            .collection('students').get();
        
        const tbody = document.getElementById('answersTableBody');
        tbody.innerHTML = '';
        
        snapshot.docs.forEach(doc => {
            const answer = doc.data();
            const row = `
                <tr id="answer-${doc.id}">
                    <td>${answer.stdid}</td>
                    <td>${answer.name}</td>
                    <td>${answer.text}</td>
                    <td>${answer.time}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading answers:', error);
    }
}

function addAnswerToTable(doc) {
    const answer = doc.data();
    const tbody = document.getElementById('answersTableBody');
    
    const existingRow = document.getElementById(`answer-${doc.id}`);
    if (existingRow) {
        existingRow.innerHTML = `
            <td>${answer.stdid}</td>
            <td>${answer.name}</td>
            <td>${answer.text}</td>
            <td>${answer.time}</td>
        `;
    } else {
        const row = document.createElement('tr');
        row.id = `answer-${doc.id}`;
        row.innerHTML = `
            <td>${answer.stdid}</td>
            <td>${answer.name}</td>
            <td>${answer.text}</td>
            <td>${answer.time}</td>
        `;
        tbody.appendChild(row);
    }
}

async function showScores() {
    try {
        const snapshot = await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .collection('scores').get();
        
        const tbody = document.getElementById('scoresTableBody');
        tbody.innerHTML = '';
        
        snapshot.docs.forEach((doc, index) => {
            const score = doc.data();
            const statusOptions = [
                'ไม่มา',
                'มาเรียน',
                'มาสาย'
            ].map((status, i) => 
                `<option value="${i}" ${score.status === i ? 'selected' : ''}>${status}</option>`
            ).join('');
            
            const row = `
                <tr id="score-${doc.id}">
                    <td>${index + 1}</td>
                    <td>${doc.id}</td>
                    <td>${score.name}</td>
                    <td>
                        <input type="text" class="form-control form-control-sm"
                               value="${score.remark || ''}"
                               onchange="updateScore('${doc.id}', 'remark', this.value)">
                    </td>
                    <td>${score.date || ''}</td>
                    <td>
                        <input type="number" class="form-control form-control-sm"
                               value="${score.score || 0}"
                               onchange="updateScore('${doc.id}', 'score', this.value)">
                    </td>
                    <td>
                        <select class="form-select form-select-sm"
                                onchange="updateScore('${doc.id}', 'status', this.value)">
                            ${statusOptions}
                        </select>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error showing scores:', error);
        alert('เกิดข้อผิดพลาดในการแสดงคะแนน');
    }
}

async function updateScore(studentId, field, value) {
    try {
        const update = {};
        update[field] = field === 'score' ? parseFloat(value) : 
                       field === 'status' ? parseInt(value) : value;
        
        await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .collection('scores').doc(studentId)
            .update(update);
    } catch (error) {
        console.error('Error updating score:', error);
        alert('เกิดข้อผิดพลาดในการอัปเดตคะแนน');
    }
}

async function updateStudent(e) {
    e.preventDefault();
    
    const studentUid = document.getElementById('editStudentUid').value;
    const studentId = document.getElementById('editStudentId').value;
    const studentName = document.getElementById('editStudentName').value;
    const studentPhoto = document.getElementById('editStudentPhoto').value;
    const studentStatus = parseInt(document.getElementById('editStudentStatus').value);
    
    try {
        const studentDoc = await db.collection('classroom').doc(classId)
            .collection('students').doc(studentUid).get();
        const currentStudentId = studentDoc.data().stdid;
        
        if (currentStudentId !== studentId) {
            const existingStudent = await db.collection('classroom').doc(classId)
                .collection('students').where('stdid', '==', studentId).get();
                
            if (!existingStudent.empty) {
                alert('รหัสนักศึกษานี้มีอยู่ในระบบแล้ว');
                return;
            }
            
            const checkinSnapshot = await db.collection('classroom').doc(classId)
                .collection('checkin').get();
                
            const batch = db.batch();
            
            for (const checkinDoc of checkinSnapshot.docs) {
                const oldScoreDoc = await db.collection('classroom').doc(classId)
                    .collection('checkin').doc(checkinDoc.id)
                    .collection('scores').doc(currentStudentId).get();
                
                if (oldScoreDoc.exists) {
                    const scoreData = oldScoreDoc.data();
                    
                    const newScoreRef = db.collection('classroom').doc(classId)
                        .collection('checkin').doc(checkinDoc.id)
                        .collection('scores').doc(studentId);
                        
                    batch.set(newScoreRef, {
                        ...scoreData,
                        name: studentName 
                    });
                    
                    
                    const oldScoreRef = db.collection('classroom').doc(classId)
                        .collection('checkin').doc(checkinDoc.id)
                        .collection('scores').doc(currentStudentId);
                        
                    batch.delete(oldScoreRef);
                }
            }
            
            await batch.commit();
        } else {
            const checkinSnapshot = await db.collection('classroom').doc(classId)
                .collection('checkin').get();
                
            const batch = db.batch();
            
            checkinSnapshot.docs.forEach(checkinDoc => {
                const scoreRef = db.collection('classroom').doc(classId)
                    .collection('checkin').doc(checkinDoc.id)
                    .collection('scores').doc(studentId);
                    
                batch.update(scoreRef, { name: studentName });
            });
            
            await batch.commit();
        }
    
        await db.collection('classroom').doc(classId)
            .collection('students').doc(studentUid)
            .update({
                stdid: studentId,
                name: studentName,
                photo: studentPhoto || 'https://via.placeholder.com/40',
                status: studentStatus
            });
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editStudentModal'));
        modal.hide();
        
        loadStudents();
        
        alert('แก้ไขข้อมูลนักศึกษาเรียบร้อยแล้ว');
    } catch (error) {
        console.error('Error updating student:', error);
        alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูลนักศึกษา');
    }
}

async function addNewStudent() {
    try {
        const studentId = document.getElementById('studentId').value;
        const studentName = document.getElementById('studentName').value;
        const studentPhoto = document.getElementById('studentPhoto').value;
        
        const existingStudent = await db.collection('classroom').doc(classId)
            .collection('students').where('stdid', '==', studentId).get();
            
        if (!existingStudent.empty) {
            alert('รหัสนักศึกษานี้มีอยู่ในระบบแล้ว');
            return;
        }
        
        await db.collection('classroom').doc(classId)
            .collection('students').add({
                stdid: studentId,
                name: studentName,
                photo: studentPhoto || 'https://via.placeholder.com/40',
                status: 1, 
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
        const checkinSnapshot = await db.collection('classroom').doc(classId)
            .collection('checkin').get();
            
        const batch = db.batch();
        checkinSnapshot.docs.forEach(doc => {
            const scoreRef = db.collection('classroom').doc(classId)
                .collection('checkin').doc(doc.id)
                .collection('scores').doc(studentId);
                
            batch.set(scoreRef, {
                uid: '', 
                name: studentName,
                status: 0,
                score: 0,
                remark: ''
            });
        });
        
        await batch.commit();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStudentModal'));
        modal.hide();
        
        document.getElementById('addStudentForm').reset();
        
        loadStudents();
        
        alert('เพิ่มนักศึกษาเรียบร้อยแล้ว');
    } catch (error) {
        console.error('Error adding student:', error);
        alert('เกิดข้อผิดพลาดในการเพิ่มนักศึกษา');
    }
}

async function loadQuestionHistory() {
    try {
        const snapshot = await db.collection('classroom').doc(classId)
            .collection('checkin').doc(currentCheckinNo)
            .collection('answers').get();
        
        if (snapshot.empty) {
            document.getElementById('questionHistorySelect').innerHTML = '<option value="">ไม่พบข้อคำถาม</option>';
            return;
        }
        
        const select = document.getElementById('questionHistorySelect');
        select.innerHTML = '<option value="">-- เลือกข้อคำถาม --</option>';
        
        snapshot.docs.forEach(doc => {
            const questionNo = doc.id;
            const questionData = doc.data();
            select.innerHTML += `<option value="${questionNo}">${questionNo}. ${questionData.text}</option>`;
        });
    } catch (error) {
        console.error('Error loading question history:', error);
        alert('เกิดข้อผิดพลาดในการโหลดประวัติคำถาม');
    }
}
