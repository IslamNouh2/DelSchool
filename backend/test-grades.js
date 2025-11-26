const http = require('http');

const BASE_URL = 'http://localhost:47005';
let cookie = '';

function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 47005,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                // Capture cookie from login
                if (path === '/auth/login' && res.headers['set-cookie']) {
                    cookie = res.headers['set-cookie'][0].split(';')[0];
                    console.log('Captured Cookie:', cookie);
                }

                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body, headers: res.headers });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function run() {
    try {
        console.log('Logging in...');
        const loginRes = await request('POST', '/auth/login', {
            username: 'admin',
            password: '123456'
        });

        if (loginRes.status !== 201 && loginRes.status !== 200) {
            console.error('Login failed:', loginRes.data);
            return;
        }
        console.log('Login successful');

        console.log('Fetching exams...');
        const examsRes = await request('GET', '/exam/exams');
        if (!examsRes.data || examsRes.data.length === 0) {
            console.error('No exams found');
            return;
        }
        const examId = examsRes.data[0].id;
        console.log(`Selected Exam ID: ${examId}`);

        console.log('Fetching classes...');
        const classesRes = await request('GET', '/class');
        // Check structure based on ClassController: returns { classes: [], total: ... } or just array?
        // ClassService.GetClasses returns { classes, total } usually.
        // Let's assume it returns { classes: [...] } or just [...]
        let classes = [];
        if (Array.isArray(classesRes.data)) {
            classes = classesRes.data;
        } else if (classesRes.data && Array.isArray(classesRes.data.classes)) {
            classes = classesRes.data.classes;
        }

        if (classes.length === 0) {
            console.error('No classes found', classesRes.data);
            return;
        }
        const classId = classes[0].classId || classes[0].id; // Check ID field name
        console.log(`Selected Class ID: ${classId}`);

        console.log(`Fetching subjects for Class ${classId}, Exam ${examId}...`);
        const subjectsRes = await request('GET', `/exam/subjects/${classId}/${examId}`);
        if (!subjectsRes.data || subjectsRes.data.length === 0) {
            console.error('No students/subjects found');
            return;
        }

        const student = subjectsRes.data[0];
        const studentId = student.studentId;
        const subject = student.subjects[0];
        const subjectId = subject.subjectId;
        
        console.log(`Selected Student ID: ${studentId}, Subject ID: ${subjectId}`);

        const payload = {
            classId: classId,
            examId: examId,
            grades: [
                {
                    studentId: studentId,
                    subjectId: subjectId,
                    grade: 18.5 // Test grade
                }
            ]
        };

        console.log('Sending grade update...', JSON.stringify(payload, null, 2));
        const saveRes = await request('POST', '/exam/grades', payload);
        console.log('Save response:', saveRes.status, saveRes.data);

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
