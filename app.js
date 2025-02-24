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

const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const addClassBtn = document.getElementById('addClassBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileForm = document.getElementById('editProfileForm');
const addClassForm = document.getElementById('addClassForm');
const classesList = document.getElementById('classesList');

auth.onAuthStateChanged(async (user) => {
    if (user) {
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                name: user.displayName,
                email: user.email,
                photo: user.photoURL
            });
            updateUserProfile({
                name: user.displayName,
                email: user.email,
                photo: user.photoURL
            });
        } else {
            const userData = userDoc.data();
            updateUserProfile(userData);
        }
        
        fetchClasses(user.uid);
    } else {
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
});

loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        console.error('Login error:', error);
    });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut().catch(error => {
        console.error('Logout error:', error);
    });
});

addClassBtn.addEventListener('click', () => {
    addClassForm.classList.toggle('hidden');
    editProfileForm.classList.add('hidden');
});

editProfileBtn.addEventListener('click', async () => {
    editProfileForm.classList.toggle('hidden');
    addClassForm.classList.add('hidden');
    
    try {
        const user = auth.currentUser;
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        document.getElementById('editName').value = userData.name;
        document.getElementById('editEmail').value = userData.email;
        document.getElementById('editPhoto').value = userData.photo;
    } catch (error) {
        console.error('Error fetching user data:', error);
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้');
    }
});

function updateUserProfile(userData) {
    document.getElementById('userName').textContent = userData.name || userData.displayName;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('userPhoto').src = userData.photo || userData.photoURL || 'https://via.placeholder.com/100';
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    const newName = document.getElementById('editName').value;
    const newEmail = document.getElementById('editEmail').value;
    const newPhoto = document.getElementById('editPhoto').value;

    try {
        const userData = {
            name: newName,
            email: newEmail,
            photo: newPhoto
        };
        
        await db.collection('users').doc(user.uid).update(userData);

        await user.updateProfile({
            displayName: newName,
            photoURL: newPhoto
        });

        if (user.email !== newEmail) {
            await user.updateEmail(newEmail);
        }

        updateUserProfile(userData);

        editProfileForm.classList.add('hidden');
        alert('อัปเดตข้อมูลเรียบร้อยแล้ว');
    } catch (error) {
        console.error('Update profile error:', error);
        alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ' + error.message);
    }
});

document.getElementById('classForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    const cid = Math.random().toString(36).substr(2, 9);
    const classData = {
        owner: user.uid,
        info: {
            code: document.getElementById('classCode').value,
            name: document.getElementById('className').value,
            room: document.getElementById('classRoom').value,
            photo: document.getElementById('classPhoto').value || 'https://via.placeholder.com/300x200'
        }
    };
    
    try {
        await db.collection('classroom').doc(cid).set(classData);
        
        await db.collection('users').doc(user.uid)
            .collection('classroom').doc(cid).set({
                status: 1
            });
        
        document.getElementById('classForm').reset();
        addClassForm.classList.add('hidden');
        fetchClasses(user.uid);
        alert('เพิ่มห้องเรียนเรียบร้อยแล้ว');
    } catch (error) {
        console.error('Add class error:', error);
        alert('เกิดข้อผิดพลาดในการเพิ่มห้องเรียน: ' + error.message);
    }
});

async function deleteClassroom(classId) {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบห้องเรียนนี้?')) {
        return;
    }

    const user = auth.currentUser;
    
    try {
        await db.collection('classroom').doc(classId).delete();
        
        await db.collection('users').doc(user.uid)
            .collection('classroom').doc(classId).delete();
        
        fetchClasses(user.uid);
        
        alert('ลบห้องเรียนเรียบร้อยแล้ว');
    } catch (error) {
        console.error('Delete class error:', error);
        alert('เกิดข้อผิดพลาดในการลบห้องเรียน: ' + error.message);
    }
}

async function fetchClasses(uid) {
    try {
        const snapshot = await db.collection('classroom')
            .where('owner', '==', uid)
            .get();
        
        classesList.innerHTML = '';
        
        snapshot.forEach(doc => {
            const classData = doc.data().info;
            const classCard = `
                <div class="col-md-4">
                    <div class="card class-card">
                        <img src="${classData.photo || 'https://via.placeholder.com/300x200'}" 
                             class="card-img-top" 
                             alt="${classData.name}">
                        <div class="card-body">
                            <h5 class="card-title">${classData.name}</h5>
                            <p class="card-text">
                                รหัสวิชา: ${classData.code}<br>
                                ห้องเรียน: ${classData.room}
                            </p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" 
                                        onclick="manageClassroom('${doc.id}')">
                                    จัดการห้องเรียน
                                </button>
                                <button class="btn btn-danger" 
                                        onclick="deleteClassroom('${doc.id}')">
                                    ลบห้องเรียน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            classesList.innerHTML += classCard;
        });
    } catch (error) {
        console.error('Fetch classes error:', error);
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลห้องเรียน: ' + error.message);
    }
}

function manageClassroom(classId) {
    // TODO: Implement classroom management functionality
    console.log('Managing classroom:', classId);
    alert('ฟังก์ชันการจัดการห้องเรียนกำลังอยู่ในระหว่างการพัฒนา');
}
