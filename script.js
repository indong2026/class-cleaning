// ==========================================
// Firebase
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// Firebase 설정
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyDuwry3Om4XhaWxwJQenq3n20hVgSD5Xvo",
  authDomain: "cleanclassroom.firebaseapp.com",
  projectId: "cleanclassroom",
  storageBucket: "cleanclassroom.firebasestorage.app",
  messagingSenderId: "746989672676",
  appId: "1:746989672676:web:ed5bee45ed359d3785f4f1",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

// ==========================================
// 청소 업무별 인원
// ==========================================

const MAX_STUDENTS = 35;

// ==========================================
// 청소 업무
// ==========================================

const JOBS = [
  // 책상 밀기
  { name: "desk1", label: "1분단 책상 밀기", count: 2, area: "1분단" },
  { name: "desk2", label: "2분단 책상 밀기", count: 2, area: "2분단" },
  { name: "desk3", label: "3분단 책상 밀기", count: 2, area: "3분단" },

  // 바닥 쓸기
  { name: "sweep1", label: "1분단 바닥 쓸기", count: 1, area: "1분단" },
  { name: "sweep2", label: "2분단 바닥 쓸기", count: 1, area: "2분단" },
  { name: "sweep3", label: "3분단 바닥 쓸기", count: 1, area: "3분단" },
  { name: "sweepTeacher", label: "교탁 앞 쓸기", count: 1, area: "교탁" },
  { name: "sweepFront", label: "앞문 쓸기", count: 1, area: "앞문" },
  { name: "sweepBack", label: "뒷문 쓸기", count: 1, area: "뒷문" },

  // 바닥 밀기
  { name: "mop1", label: "1분단 바닥 밀기", count: 1, area: "1분단" },
  { name: "mop2", label: "2분단 바닥 밀기", count: 1, area: "2분단" },
  { name: "mop3", label: "3분단 바닥 밀기", count: 1, area: "3분단" },
  { name: "mopTeacher", label: "교탁 앞 바닥 밀기", count: 1, area: "교탁" },

  // 밀대걸레 빨기
  { name: "wash1", label: "1분단 밀대걸레 빨기", count: 1, area: "1분단" },
  { name: "wash2", label: "2분단 밀대걸레 빨기", count: 1, area: "2분단" },
  { name: "wash3", label: "3분단 밀대걸레 빨기", count: 1, area: "3분단" },
  { name: "washTeacher", label: "교탁 밀대걸레 빨기", count: 1, area: "교탁" },

  // 창문
  { name: "window", label: "창문 선반 정리", count: 2, area: "창문" },
];

const TOTAL_SELECTED = JOBS.reduce((sum, job) => sum + job.count, 0);

// ==========================================
// HTML 요소
// ==========================================

const studentInputs = document.getElementById("studentInputs");

const studentCount = document.getElementById("studentCount");

const addStudentBtn = document.getElementById("addStudentBtn");

const saveStudentsBtn = document.getElementById("saveStudentsBtn");

const clearStudentsBtn = document.getElementById("clearStudentsBtn");

const drawBtn = document.getElementById("drawBtn");

const drawMessage = document.getElementById("drawMessage");

const resultsContainer = document.getElementById("resultsContainer");

const resetResultBtn = document.getElementById("resetResultBtn");

const confirmResultBtn = document.getElementById("confirmResultBtn");

let currentAssignment = null;

const toggleStudentsBtn = document.getElementById("toggleStudentsBtn");

const excludeInputs = document.getElementById("excludeInputs");

const excludeCount = document.getElementById("excludeCount");

const addExcludeBtn = document.getElementById("addExcludeBtn");

const toggleStatsBtn = document.getElementById("toggleStatsBtn");

const statsContent = document.getElementById("statsContent");

const statsList = document.getElementById("statsList");

const resetHistoryBtn = document.getElementById("resetHistoryBtn");

const deskResult = document.getElementById("deskResult");
const sweepResult = document.getElementById("sweepResult");
const mopResult = document.getElementById("mopResult");
const washResult = document.getElementById("washResult");

const resultGrid = document.querySelector(".result-grid");

const openOverviewBtn = document.getElementById("openOverviewBtn");

const closeOverviewBtn = document.getElementById("closeOverviewBtn");

const overviewModal = document.getElementById("overviewModal");

const overviewList = document.getElementById("overviewList");

const sortNumberBtn = document.getElementById("sortNumberBtn");

const sortAreaBtn = document.getElementById("sortAreaBtn");

let overviewSortMode = "number";

// ==========================================
// 학생 입력창 생성
// ==========================================

function createStudentInput(value = "") {
  const input = document.createElement("input");

  input.type = "text";

  input.className = "student-input";

  input.placeholder = "학생 이름";

  input.value = value;

  input.addEventListener("input", () => {
    updateStudentCount();
  });

  studentInputs.appendChild(input);
}

// ==========================================
// 기본 입력창 생성
// ==========================================

function createDefaultInputs() {
  studentInputs.innerHTML = "";

  for (let i = 0; i < 29; i++) {
    createStudentInput();
  }

  updateStudentCount();
}

// ==========================================
// 학생 수 표시
// ==========================================

function updateStudentCount() {
  const inputs = [...document.querySelectorAll(".student-input")];

  const count = inputs.filter((input) => input.value.trim() !== "").length;

  studentCount.textContent = `${count} / ${MAX_STUDENTS}명`;

  if (count >= TOTAL_SELECTED) {
    studentCount.style.color = "#16803c";
  } else {
    studentCount.style.color = "#777";
  }
}

// ==========================================
// 현재 학생 명단 가져오기
// ==========================================

function getStudents() {
  const inputs = [...document.querySelectorAll(".student-input")];

  return inputs
    .map((input) => input.value.trim())
    .filter((name) => name !== "");
}

// ==========================================
// 중복 이름 검사
// ==========================================

function hasDuplicateNames(students) {
  const normalized = students.map((name) =>
    name.replace(/\s+/g, "").toLowerCase(),
  );

  return new Set(normalized).size !== normalized.length;
}

// ==========================================
// Firebase에서 학생 명단 불러오기
// ==========================================

async function loadStudentsFromFirebase() {
  try {
    const snapshot = await getDocs(collection(db, "students"));

    const students = [];

    snapshot.forEach((studentDoc) => {
      const data = studentDoc.data();

      if (data.name) {
        students.push({
          name: data.name,
          order: data.order ?? 999,
        });
      }
    });

    // 저장된 순서대로 정렬
    students.sort((a, b) => a.order - b.order);

    // 이름만 추출
    const studentNames = students.map((student) => student.name);

    studentInputs.innerHTML = "";

    if (students.length === 0) {
      createDefaultInputs();

      drawMessage.textContent = "학생 명단을 입력해주세요.";

      return;
    }

    // 최대 35명까지만
    const limitedStudents = studentNames.slice(0, MAX_STUDENTS);

    limitedStudents.forEach((name) => {
      createStudentInput(name);
    });

    // 빈 입력칸도 35개까지 유지
    for (let i = limitedStudents.length; i < 29; i++) {
      createStudentInput();
    }

    updateStudentCount();

    drawMessage.textContent = "Firebase에서 학생 명단을 불러왔습니다.";

    console.log("학생 명단 불러오기 완료:", students);
  } catch (error) {
    console.error("학생 명단 불러오기 실패:", error);

    alert(
      "학생 명단을 불러오지 못했습니다.\nFirebase 설정과 Firestore를 확인해주세요.",
    );

    createDefaultInputs();
  }
}

studentInputs.style.display = "none";
toggleStudentsBtn.textContent = "▼ 펼치기";

// ==========================================
// Firebase에 학생 명단 저장
// ==========================================

async function saveStudentsToFirebase() {
  const students = getStudents();

  // ------------------------------------------
  // 인원 검사
  // ------------------------------------------

  if (students.length === 0) {
    alert("학생 이름을 한 명 이상 입력해주세요.");

    return;
  }

  if (students.length > MAX_STUDENTS) {
    alert(`최대 ${MAX_STUDENTS}명까지 등록할 수 있습니다.`);

    return;
  }

  // ------------------------------------------
  // 중복 이름 검사
  // ------------------------------------------

  if (hasDuplicateNames(students)) {
    alert("같은 이름의 학생이 있습니다.\n학생 이름을 확인해주세요.");

    return;
  }

  // ------------------------------------------
  // 저장 중
  // ------------------------------------------

  saveStudentsBtn.disabled = true;

  saveStudentsBtn.textContent = "💾 저장 중...";

  try {
    // 기존 students 문서 가져오기
    const snapshot = await getDocs(collection(db, "students"));

    // 기존 데이터 삭제
    for (const studentDoc of snapshot.docs) {
      await deleteDoc(doc(db, "students", studentDoc.id));
    }

    // 새로운 학생 저장
    // 기존 학생들의 청소 기록 가져오기
    const existingData = {};

    snapshot.forEach((studentDoc) => {
      const data = studentDoc.data();

      if (data.name) {
        const key = data.name.replace(/\s+/g, "").toLowerCase();

        existingData[key] = {
          total: data.total || 0,
          jobs: data.jobs || {},
        };
      }
    });

    // 새로운 학생 저장
    for (let i = 0; i < students.length; i++) {
      const name = students[i];

      const key = name.replace(/\s+/g, "").toLowerCase();

      const oldData = existingData[key] || {
        total: 0,
        desk: 0,
        sweep: 0,
        mop: 0,
        wash: 0,
      };

      await addDoc(collection(db, "students"), {
        name: name,

        order: i,

        total: oldData.total || 0,

        jobs: oldData.jobs || {},
      });
    }

    drawMessage.textContent = "✅ 학생 명단이 Firebase에 저장되었습니다.";

    alert(`학생 ${students.length}명의 명단이 저장되었습니다.`);

    console.log("학생 명단 저장 완료");
  } catch (error) {
    console.error("학생 명단 저장 실패:", error);

    alert(
      "학생 명단 저장에 실패했습니다.\nFirebase 설정과 Firestore 보안 규칙을 확인해주세요.",
    );
  } finally {
    saveStudentsBtn.disabled = false;

    saveStudentsBtn.textContent = "💾 명단 저장";
  }
}

// ==========================================
// 학생 추가
// ==========================================

addStudentBtn.addEventListener("click", () => {
  const currentInputs = document.querySelectorAll(".student-input").length;

  if (currentInputs >= MAX_STUDENTS) {
    alert(`최대 ${MAX_STUDENTS}명까지 입력할 수 있습니다.`);

    return;
  }

  createStudentInput();

  updateStudentCount();
});

// ==========================================
// 학생의 특정 구역 청소 기록
// ==========================================

function getAreaHistoryCount(student, area) {
  if (!student.jobs) return 0;

  let count = 0;

  for (const job of JOBS) {
    if (job.area !== area) continue;

    count += student.jobs[job.name] || 0;
  }

  return count;
}

// ==========================================
// 학생 명단 저장 버튼
// ==========================================

saveStudentsBtn.addEventListener("click", saveStudentsToFirebase);

// ==========================================
// 명단 초기화
// ==========================================

clearStudentsBtn.addEventListener("click", async () => {
  const answer = confirm("Firebase에 저장된 학생 명단까지 모두 삭제할까요?");

  if (!answer) {
    return;
  }

  try {
    const snapshot = await getDocs(collection(db, "students"));

    for (const studentDoc of snapshot.docs) {
      await deleteDoc(doc(db, "students", studentDoc.id));
    }

    createDefaultInputs();

    clearResults();

    drawMessage.textContent = "학생 명단이 초기화되었습니다.";

    alert("학생 명단이 Firebase에서 삭제되었습니다.");
  } catch (error) {
    console.error("학생 명단 삭제 실패:", error);

    alert("학생 명단 삭제에 실패했습니다.");
  }
});

// ==========================================
// 랜덤 섞기
// ==========================================

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }

  return result;
}

// ==========================================
// 랜덤 배정
// ==========================================

// ==========================================
// Firebase 학생 데이터 가져오기
// ==========================================

// ==========================================
// Firebase 학생 데이터 가져오기
// ==========================================

// ==========================================
// Firebase 학생 데이터 가져오기
// ==========================================

async function getStudentData() {
  const snapshot = await getDocs(collection(db, "students"));

  const students = [];

  snapshot.forEach((studentDoc) => {
    const data = studentDoc.data();

    students.push({
      id: studentDoc.id,

      name: data.name,

      total: data.total || 0,

      // 업무별 기록
      jobs: data.jobs || {},

      // 최근 청소 기록
      history: data.history || [],
    });
  });

  return students;
}

// ==========================================
// 공평 랜덤 가중치 계산
// ==========================================

function calculateWeight(student, average) {

  const total = student.total || 0;

  // 평균보다 얼마나 적게 했는지
  const difference = average - total;

  let weight;

  if (difference >= 4) {
    weight = 20;
  } else if (difference >= 3) {
    weight = 15;
  } else if (difference >= 2) {
    weight = 11;
  } else if (difference >= 1) {
    weight = 8;
  } else if (difference >= 0) {
    weight = 6;
  } else if (difference >= -1) {
    weight = 4;
  } else if (difference >= -2) {
    weight = 2;
  } else {
    weight = 1;
  }

  return weight;
}

// ==========================================
// 가중치 랜덤
// ==========================================

function weightedRandom(students, count) {
  const selected = [];
  const remaining = [...students];

  while (selected.length < count && remaining.length > 0) {
    const totalCount = remaining.reduce(
      (sum, student) => sum + (student.total || 0),
      0,
    );

    const average = totalCount / remaining.length;

    const weightedStudents = remaining.map((student) => {
      return {
        student,
        weight: calculateWeight(student, average),
      };
    });

    // 이하 기존 코드...

    const weightSum = weightedStudents.reduce(
      (sum, item) => sum + item.weight,
      0,
    );

    let random = Math.random() * weightSum;

    let selectedIndex = 0;

    for (let i = 0; i < weightedStudents.length; i++) {
      random -= weightedStudents[i].weight;

      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    const chosen = weightedStudents[selectedIndex].student;

    selected.push(chosen);

    const index = remaining.indexOf(chosen);

    remaining.splice(index, 1);
  }

  return selected;
}

// ==========================================
// 공평 랜덤 배정
// ==========================================

async function drawCleaning() {
  const excludedStudents = getExcludedStudents();

  const students = getStudents();

  // ------------------------------------------
  // 학생 수 검사
  // ------------------------------------------

  if (students.length < TOTAL_SELECTED) {
    alert(
      `최소 ${TOTAL_SELECTED}명의 학생이 필요합니다.\n현재 ${students.length}명입니다.`,
    );

    return;
  }

  // ------------------------------------------
  // 중복 이름 검사
  // ------------------------------------------

  if (hasDuplicateNames(students)) {
    alert("같은 이름의 학생이 있습니다.\n학생 이름을 확인해주세요.");

    return;
  }

  // ------------------------------------------
  // 버튼 비활성화
  // ------------------------------------------

  drawBtn.classList.add("drawing");

  drawBtn.textContent = "🎲 기록 확인 중...";

  drawMessage.textContent = "학생들의 청소 기록을 확인하고 있습니다.";

  try {
    // ----------------------------------------
    // Firebase 데이터 가져오기
    // ----------------------------------------

    const firebaseStudents = await getStudentData();

    // ----------------------------------------
    // 현재 입력된 학생과 Firebase 데이터 연결
    // ----------------------------------------

    const studentData = students.map((name) => {
      const data = firebaseStudents.find((student) => student.name === name);

      // Firebase에 없는 학생
      // → 새 학생으로 취급
      if (!data) {
        return {
          id: null,

          name: name,

          total: 0,

          desk: 0,

          sweep: 0,

          mop: 0,

          wash: 0,
        };
      }

      return data;
    });

    const availableStudents = studentData.filter((student) => {
      return !excludedStudents.some(
        (excluded) =>
          excluded.replace(/\s+/g, "").toLowerCase() ===
          student.name.replace(/\s+/g, "").toLowerCase(),
      );
    });

    // ----------------------------------------
    // 공평 랜덤
    // ----------------------------------------

    drawBtn.textContent = "🎲 공평하게 배정 중...";

    drawMessage.textContent =
      "청소 횟수가 적은 학생을 우선하여 배정하고 있습니다.";

    // 12명 선택
    if (availableStudents.length < TOTAL_SELECTED) {
      alert(
        `제외 학생을 빼고 배정 가능한 학생이 ${availableStudents.length}명입니다.\n최소 ${TOTAL_SELECTED}명이 필요합니다.`,
      );

      drawBtn.classList.remove("drawing");
      drawBtn.textContent = "🎲 청소 랜덤 배정";

      return;
    }

    const selected = weightedRandom(availableStudents, TOTAL_SELECTED);

    // ----------------------------------------
    // 업무 배정
    // ----------------------------------------

    const assignment = {};

    // 아직 업무가 배정되지 않은 학생
    let remainingStudents = [...selected];

    // 업무도 랜덤하게 섞음
    const shuffledJobs = shuffle(JOBS);

    for (const job of shuffledJobs) {
      const candidates = [...remainingStudents];

      // 학생마다 이 업무와 같은 구역을 했던 횟수를 기준으로 정렬
      candidates.sort((a, b) => {
        const aAreaCount = getAreaHistoryCount(a, job.area);
        const bAreaCount = getAreaHistoryCount(b, job.area);

        // 같은 구역을 적게 한 학생을 우선
        if (aAreaCount !== bAreaCount) {
          return aAreaCount - bAreaCount;
        }

        // 같은 구역 기록도 같으면 총 청소 횟수가 적은 학생 우선
        return (a.total || 0) - (b.total || 0);
      });

      // 후보 중 상위 학생들을 섞어서 랜덤성 유지
      const topCandidates = candidates.slice(0, Math.min(3, candidates.length));

      const chosen = shuffle(topCandidates).slice(0, job.count);

      assignment[job.name] = chosen;

      // 선택된 학생 제거
      remainingStudents = remainingStudents.filter(
        (student) => !chosen.includes(student),
      );
    }

    currentAssignment = assignment;

    renderOverview();

    // ----------------------------------------
    // 결과 표시
    // ----------------------------------------

    setTimeout(() => {
      displayResult(currentAssignment);

      drawBtn.classList.remove("drawing");

      drawBtn.textContent = "🎲 다시 랜덤 배정";

      drawMessage.textContent =
        "청소 횟수를 고려하여 오늘의 담당을 결정했습니다.";
    }, 700);
  } catch (error) {
    console.error("청소 배정 실패:", error);

    alert("청소 배정 중 오류가 발생했습니다.\nFirebase 연결을 확인해주세요.");

    drawBtn.classList.remove("drawing");

    drawBtn.textContent = "🎲 청소 랜덤 배정";

    drawMessage.textContent = "배정에 실패했습니다.";
  }
}

// ==========================================
// 결과 표시
// ==========================================

// ==========================================
// 청소 결과 표시
// ==========================================

function displayResult(assignment) {
  resultGrid.innerHTML = "";

  JOBS.forEach((job) => {
    const students = assignment[job.name] || [];

    const card = document.createElement("div");

    card.className = "job-card";

    const icon = document.createElement("div");

    icon.className = "job-icon";

    if (job.name.startsWith("desk")) {
      icon.textContent = "🪑";
    } else if (job.name.startsWith("sweep")) {
      icon.textContent = "🧹";
    } else if (job.name.startsWith("mop")) {
      icon.textContent = "🧽";
    } else if (job.name.startsWith("wash")) {
      icon.textContent = "🪣";
    } else {
      icon.textContent = "🪟";
    }

    const title = document.createElement("h3");

    title.textContent = job.label;

    const count = document.createElement("span");

    count.className = "job-count";

    count.textContent = `${job.count}명`;

    const studentList = document.createElement("div");

    studentList.className = "student-list";

    students.forEach((student, index) => {
      const element = document.createElement("div");

      element.className = "student animate";

      element.textContent = student.name;

      element.style.animationDelay = `${index * 0.08}s`;

      studentList.appendChild(element);
    });

    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(count);
    card.appendChild(studentList);

    resultGrid.appendChild(card);
  });
}

// ==========================================
// 학생 이름 표시
// ==========================================

function displayStudents(container, students) {
  container.innerHTML = "";

  students.forEach((name, index) => {
    const element = document.createElement("div");

    element.className = "student animate";

    element.textContent = name.name;

    element.style.animationDelay = `${index * 0.08}s`;

    container.appendChild(element);
  });
}

// ==========================================
// 결과 초기화
// ==========================================

function clearResults() {
  resultGrid.innerHTML = "";

  drawMessage.textContent = "학생 22명을 입력한 후 배정 버튼을 눌러주세요.";
}

resetResultBtn.addEventListener("click", () => {
  const answer = confirm("청소 배정 결과를 초기화할까요?");

  if (!answer) return;

  clearResults();
});

// ==========================================
// 랜덤 배정 버튼
// ==========================================

drawBtn.addEventListener("click", drawCleaning);

// ==========================================
// 시작
// ==========================================

// ==========================================
// 배정 확정
// ==========================================

async function confirmAssignment() {
  if (!currentAssignment) {
    alert("먼저 청소 배정을 해주세요.");
    return;
  }

  const answer = confirm(
    "오늘의 청소 배정을 확정할까요?\n확정하면 학생들의 청소 기록이 올라갑니다.",
  );

  if (!answer) return;

  confirmResultBtn.disabled = true;
  confirmResultBtn.textContent = "저장 중...";

  try {
    // ------------------------------------------
    // 각 업무별로 학생 기록 저장
    // ------------------------------------------

    for (const job of JOBS) {
      const assignedStudents = currentAssignment[job.name] || [];

      for (const student of assignedStudents) {
        if (!student.id) continue;

        // ==========================================
        // 현재 기록 가져오기
        // ==========================================

        const currentJobs = student.jobs || {};

        const currentHistory = student.history || [];

        // ==========================================
        // 해당 업무 기존 횟수
        // ==========================================

        const currentJobCount = currentJobs[job.name] || 0;

        // ==========================================
        // 전체 청소 횟수 증가
        // ==========================================

        const newTotal = (student.total || 0) + 1;

        // ==========================================
        // 업무별 횟수 증가
        // ==========================================

        const newJobs = {
          ...currentJobs,

          [job.name]: currentJobCount + 1,
        };

        // ==========================================
        // 최근 청소 기록 추가
        // 최대 30개만 보관
        // ==========================================

        const newHistory = [
          ...currentHistory,

          {
            job: job.name,

            label: job.label,

            area: job.area,

            date: new Date().toISOString(),
          },
        ].slice(-30);

        // ==========================================
        // Firebase 저장
        // ==========================================

        await updateDoc(doc(db, "students", student.id), {
          total: newTotal,

          jobs: newJobs,

          history: newHistory,
        });
      }
    }

    // ------------------------------------------
    // 완료
    // ------------------------------------------

    alert("오늘의 청소 배정이 확정되었습니다.");

    drawMessage.textContent =
      "✅ 오늘의 청소 배정이 확정되었습니다.";

    confirmResultBtn.textContent = "✅ 배정 완료";

    currentAssignment = null;

  } catch (error) {
    console.error("배정 확정 실패:", error);

    alert("배정 기록 저장에 실패했습니다.");

    confirmResultBtn.disabled = false;
    confirmResultBtn.textContent = "✅ 배정 확정";
  }
}

confirmResultBtn.addEventListener(
  "click",
  confirmAssignment
);

// ==========================================
// 학생 명단 접기 / 펼치기
// ==========================================

toggleStudentsBtn.addEventListener(
  "click",
  () => {

    const isHidden =
      studentInputs.style.display === "none";


    if (isHidden) {

      studentInputs.style.display =
        "grid";

      toggleStudentsBtn.textContent =
        "▲ 접기";

    } else {

      studentInputs.style.display =
        "none";

      toggleStudentsBtn.textContent =
        "▼ 펼치기";

    }

  }
);

addStudentBtn.addEventListener("click", () => {
  const currentInputs = document.querySelectorAll(".student-input").length;

  if (currentInputs >= MAX_STUDENTS) {
    alert(`최대 ${MAX_STUDENTS}명까지 입력할 수 있습니다.`);

    return;
  }

  createStudentInput();

  updateStudentCount();
});

// ==========================================
// 제외 학생 입력창
// ==========================================

function createExcludeInput(value = "") {

  const input =
    document.createElement("input");

  input.type = "text";

  input.className =
    "exclude-input";

  input.placeholder =
    "제외할 학생";

  input.value =
    value;

  input.addEventListener(
    "input",
    updateExcludeCount
  );

  excludeInputs.appendChild(input);

  updateExcludeCount();
}


// ==========================================
// 제외 학생 가져오기
// ==========================================

function getExcludedStudents() {
  const inputs = [...document.querySelectorAll(".exclude-input")];

  return inputs
    .map((input) => input.value.trim())
    .filter((name) => name !== "");
}


// ==========================================
// 제외 학생 수
// ==========================================

function updateExcludeCount() {

  const count =
    getExcludedStudents().length;

  excludeCount.textContent =
    `${count}명`;

}

// ==========================================
// 기본 제외 학생
// ==========================================

const DEFAULT_EXCLUDED_STUDENTS = [
  "하성빈",
  "홍신우",
  "류진하",
  "백선아",
  "강민지",
  "김혜원",
  "정세호",
];

function createDefaultExcludeInputs() {
  excludeInputs.innerHTML = "";

  DEFAULT_EXCLUDED_STUDENTS.forEach((name) => {
    createExcludeInput(name);
  });

  updateExcludeCount();
}

loadStudentsFromFirebase();
createDefaultExcludeInputs();


// ==========================================
// 제외 학생 추가
// ==========================================

addExcludeBtn.addEventListener(
  "click",
  () => {

    createExcludeInput();

  }
);

// ==========================================
// 통계 접기 / 펼치기
// ==========================================

statsContent.style.display = "none";

toggleStatsBtn.addEventListener(
  "click",
  async () => {

    const hidden =
      statsContent.style.display === "none";

    if (hidden) {

      statsContent.style.display = "block";

      toggleStatsBtn.textContent =
        "▲ 접기";

      await loadStatistics();

    } else {

      statsContent.style.display = "none";

      toggleStatsBtn.textContent =
        "▼ 보기";

    }

  }
);

// ==========================================
// 청소 통계 불러오기
// ==========================================

// ==========================================
// 청소 통계 불러오기
// ==========================================

// ==========================================
// 청소 통계 불러오기
// ==========================================

// ==========================================
// 청소 통계 불러오기
// ==========================================

// ==========================================
// 청소 통계 불러오기
// ==========================================

async function loadStatistics() {
  try {
    const students = await getStudentData();

    // ------------------------------------------
    // 실제 배정 대상만 남김
    // ------------------------------------------

    const excludedSet = new Set(
      getExcludedStudents().map((name) =>
        name.replace(/\s+/g, "").toLowerCase(),
      ),
    );

    const availableStudents = students.filter((student) => {
      const key = student.name.replace(/\s+/g, "").toLowerCase();

      return !excludedSet.has(key);
    });

    if (availableStudents.length === 0) {
      statsList.innerHTML = "<p>통계를 표시할 학생이 없습니다.</p>";

      return;
    }

    // ==========================================
    // 10,000회 실제 배정 시뮬레이션
    // ==========================================

    const simulationCount = 10000;

    // 학생별 업무 배정 횟수
    const jobCounts = {};

    availableStudents.forEach((student) => {
      jobCounts[student.id] = {};

      JOBS.forEach((job) => {
        jobCounts[student.id][job.name] = 0;
      });
    });

    // ------------------------------------------
    // 10,000번 실제 배정
    // ------------------------------------------

    for (let i = 0; i < simulationCount; i++) {
      const selected = weightedRandom(availableStudents, TOTAL_SELECTED);

      let remainingStudents = [...selected];

      const shuffledJobs = shuffle(JOBS);

      for (const job of shuffledJobs) {
        if (remainingStudents.length === 0) {
          break;
        }

        const candidates = [...remainingStudents];

        // --------------------------------------
        // 구역 기록이 적은 학생 우선
        // --------------------------------------

        candidates.sort((a, b) => {
          const aAreaCount = getAreaHistoryCount(a, job.area);

          const bAreaCount = getAreaHistoryCount(b, job.area);

          if (aAreaCount !== bAreaCount) {
            return aAreaCount - bAreaCount;
          }

          // 구역 기록까지 같으면
          // 전체 청소 횟수가 적은 학생 우선

          if ((a.total || 0) !== (b.total || 0)) {
            return (a.total || 0) - (b.total || 0);
          }

          return Math.random() - 0.5;
        });

        // 상위 후보에서 랜덤 선택
        const topCandidates = candidates.slice(
          0,
          Math.min(3, candidates.length),
        );

        const chosen = shuffle(topCandidates).slice(0, job.count);

        // --------------------------------------
        // 업무 배정 기록
        // --------------------------------------

        chosen.forEach((student) => {
          if (
            jobCounts[student.id] &&
            jobCounts[student.id][job.name] !== undefined
          ) {
            jobCounts[student.id][job.name]++;
          }
        });

        // 선택된 학생 제거
        remainingStudents = remainingStudents.filter(
          (student) => !chosen.includes(student),
        );
      }
    }

    // ==========================================
    // 통계 화면 생성
    // ==========================================

    statsList.innerHTML = "";

    // ==========================================
    // 최근 실제 청소 기록
    // ==========================================

    const recentHistory = [];

    availableStudents.forEach((student) => {
      if (!student.history) return;

      student.history.forEach((record) => {
        recentHistory.push({
          studentName: student.name,
          ...record,
        });
      });
    });

    // 학생 이름순 정렬
    recentHistory.sort((a, b) =>
      a.studentName.localeCompare(b.studentName, "ko"),
    );

    // ==========================================
    // 최근 배정 기록 표시
    // ==========================================

    if (recentHistory.length > 0) {
      const recentTitle = document.createElement("div");

      recentTitle.className = "stat-section-title";
      recentTitle.textContent = "🕒 최근 배정 기록";

      statsList.appendChild(recentTitle);

      const recentList = document.createElement("div");

      recentList.className = "recent-history-list";

      recentHistory.slice(0, 20).forEach((record) => {
        const item = document.createElement("div");

        item.className = "recent-history-item";

        const studentName = document.createElement("strong");

        studentName.textContent = record.studentName;

        const jobName = document.createElement("span");

        jobName.textContent = record.label;

        const date = document.createElement("small");

        const dateObject = new Date(record.date);

        date.textContent =
          dateObject.toLocaleDateString("ko-KR", {
            month: "numeric",
            day: "numeric",
          }) +
          " " +
          dateObject.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          });

        item.appendChild(studentName);
        item.appendChild(jobName);
        item.appendChild(date);

        recentList.appendChild(item);
      });

      statsList.appendChild(recentList);
    }

    // 학생 이름순
    const sortedStudents = [...availableStudents].sort((a, b) =>
      a.name.localeCompare(b.name, "ko"),
    );

    sortedStudents.forEach((student) => {
      const card = document.createElement("div");

      card.className = "stat-card";

      // ----------------------------------------
      // 학생 기본 정보
      // ----------------------------------------

      const header = document.createElement("div");

      header.className = "stat-header";

      const name = document.createElement("div");

      name.className = "stat-name";

      name.textContent = student.name;

      const total = document.createElement("div");

      total.className = "stat-total";

      total.textContent = `총 ${student.total || 0}회`;

      header.appendChild(name);
      header.appendChild(total);

      card.appendChild(header);

      // ----------------------------------------
      // 업무별 확률
      // ----------------------------------------

      const probabilityTitle = document.createElement("div");

      probabilityTitle.className = "stat-section-title";

      probabilityTitle.textContent = "🎲 업무별 배정 확률";

      card.appendChild(probabilityTitle);

      const probabilityList = document.createElement("div");

      probabilityList.className = "stat-job-list";

      // 확률이 높은 업무부터 정렬
      const jobStatistics = JOBS.map((job) => {
        const count = jobCounts[student.id][job.name] || 0;

        const probability = (count / simulationCount) * 100;

        return {
          job,
          probability,
        };
      }).sort((a, b) => b.probability - a.probability);

      jobStatistics.forEach((item) => {
        const jobItem = document.createElement("div");

        jobItem.className = "stat-job-item";

        const jobName = document.createElement("span");

        jobName.textContent = item.job.label;

        const probability = document.createElement("strong");

        probability.textContent = `${item.probability.toFixed(1)}%`;

        jobItem.appendChild(jobName);
        jobItem.appendChild(probability);

        probabilityList.appendChild(jobItem);
      });

      card.appendChild(probabilityList);

      // ----------------------------------------
      // 실제 업무 기록
      // ----------------------------------------

      const historyTitle = document.createElement("div");

      historyTitle.className = "stat-section-title";

      historyTitle.textContent = "📋 지금까지 한 업무";

      card.appendChild(historyTitle);

      const historyList = document.createElement("div");

      historyList.className = "stat-job-list";

      let hasHistory = false;

      JOBS.forEach((job) => {
        const count = student.jobs?.[job.name] || 0;

        if (count > 0) {
          hasHistory = true;

          const jobItem = document.createElement("div");

          jobItem.className = "stat-job-item";

          const jobName = document.createElement("span");

          jobName.textContent = job.label;

          const jobCount = document.createElement("strong");

          jobCount.textContent = `${count}회`;

          jobItem.appendChild(jobName);
          jobItem.appendChild(jobCount);

          historyList.appendChild(jobItem);
        }
      });

      if (!hasHistory) {
        const empty = document.createElement("div");

        empty.className = "stat-job-empty";

        empty.textContent = "아직 업무 기록이 없습니다.";

        historyList.appendChild(empty);
      }

      card.appendChild(historyList);

      statsList.appendChild(card);
    });
  } catch (error) {

    console.error(
      "통계 불러오기 실패:",
      error
    );

    statsList.innerHTML =
      "<p>통계를 불러오지 못했습니다.</p>";
  }
}

// ==========================================
// 청소 기록 초기화
// ==========================================

const ADMIN_PASSWORD =
  "26209";

  resetHistoryBtn.addEventListener("click", async () => {
    const password = prompt("관리자 비밀번호를 입력하세요.");

    if (password === null) {
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      alert("비밀번호가 올바르지 않습니다.");

      return;
    }

    const answer = confirm("모든 학생의 청소 기록을 0회로 초기화할까요?");

    if (!answer) {
      return;
    }

    resetHistoryBtn.disabled = true;

    resetHistoryBtn.textContent = "초기화 중...";

    try {
      const students = await getStudentData();

      for (const student of students) {
        await updateDoc(doc(db, "students", student.id), {
          // 전체 청소 횟수
          total: 0,

          // 업무별 횟수
          jobs: {
            desk1: 0,
            desk2: 0,
            desk3: 0,

            sweep1: 0,
            sweep2: 0,
            sweep3: 0,
            sweepTeacher: 0,
            sweepFront: 0,
            sweepBack: 0,

            mop1: 0,
            mop2: 0,
            mop3: 0,
            mopTeacher: 0,

            wash1: 0,
            wash2: 0,
            wash3: 0,
            washTeacher: 0,

            window: 0,
          },

          // 최근 청소 기록도 전부 삭제
          history: [],
        });
      }

      alert("청소 기록이 모두 초기화되었습니다.");

      await loadStatistics();
    } catch (error) {
      console.error("기록 초기화 실패:", error);

      alert("기록 초기화에 실패했습니다.");
    } finally {
      resetHistoryBtn.disabled = false;

      resetHistoryBtn.textContent = "🔐 청소 기록 초기화";
    }
  });


// ==========================================
// 현재 배정 한눈에 보기
// ==========================================

function renderOverview() {

  // 배정 결과가 없는 경우
  if (!currentAssignment) {

    overviewList.innerHTML = `
      <div class="overview-empty">
        <div class="overview-empty-icon">📋</div>
        <strong>아직 청소 배정 결과가 없습니다.</strong>
        <span>먼저 청소 랜덤 배정을 해주세요.</span>
      </div>
    `;

    return;
  }


  // ==========================================
  // 학생 번호 가져오기
  // ==========================================

  const studentOrder = getStudents();


  // ==========================================
  // 번호순
  // ==========================================

  if (overviewSortMode === "number") {

    const assignments = [];

    JOBS.forEach((job) => {

      const students =
        currentAssignment[job.name] || [];

      students.forEach((student) => {

        assignments.push({
          student: student.name,
          job: job.label,
          area: job.area
        });

      });

    });


    // 학생 명단에 입력된 순서대로 정렬
    assignments.sort((a, b) => {

      return (
        studentOrder.indexOf(a.student) -
        studentOrder.indexOf(b.student)
      );

    });


    overviewList.innerHTML = `
      <div class="overview-number-grid"></div>
    `;

    const numberGrid =
      overviewList.querySelector(".overview-number-grid");


    assignments.forEach((item) => {

      const studentNumber =
        studentOrder.indexOf(item.student) + 1;


      const row =
        document.createElement("div");

      row.className =
        "overview-number-row";


      const number =
        document.createElement("span");

      number.className =
        "overview-student-number";

      number.textContent =
        String(studentNumber).padStart(2, "0");


      const name =
        document.createElement("strong");

      name.className =
        "overview-number-name";

      name.textContent =
        item.student;


      const job =
        document.createElement("span");

      job.className =
        "overview-number-job";

      job.textContent =
        item.job;


      const area =
        document.createElement("span");

      area.className =
        "overview-number-area";

      area.textContent =
        item.area;


      row.appendChild(number);
      row.appendChild(name);
      row.appendChild(job);
      row.appendChild(area);

      numberGrid.appendChild(row);

    });

    return;
  }


  // ==========================================
  // 구역순
  // ==========================================

  const areaOrder = [
    "1분단",
    "2분단",
    "3분단",
    "교탁",
    "앞문",
    "뒷문",
    "창문"
  ];


  overviewList.innerHTML = `
    <div class="overview-area-grid"></div>
  `;

  const areaGrid =
    overviewList.querySelector(".overview-area-grid");


  // ==========================================
  // 구역별 카드 생성
  // ==========================================

  areaOrder.forEach((area) => {

    const areaJobs =
      JOBS.filter((job) => job.area === area);


    // 해당 구역 카드
    const areaCard =
      document.createElement("div");

    areaCard.className =
      "overview-area-card";


    // 구역 제목
    const areaHeader =
      document.createElement("div");

    areaHeader.className =
      "overview-area-header";


    const areaTitle =
      document.createElement("h3");

    areaTitle.textContent =
      area;


    const areaCount =
      document.createElement("span");


    let totalStudents = 0;

    areaJobs.forEach((job) => {

      totalStudents +=
        (currentAssignment[job.name] || []).length;

    });


    areaCount.textContent =
      `${totalStudents}명`;


    areaHeader.appendChild(areaTitle);
    areaHeader.appendChild(areaCount);

    areaCard.appendChild(areaHeader);


    // ==========================================
    // 업무별 표시
    // ==========================================

    areaJobs.forEach((job) => {

      const students =
        currentAssignment[job.name] || [];


      // 배정된 사람이 없으면 표시하지 않음
      if (students.length === 0) {
        return;
      }


      const jobBox =
        document.createElement("div");

      jobBox.className =
        "overview-area-job";


      const jobTitle =
        document.createElement("div");

      jobTitle.className =
        "overview-area-job-title";


      // 업무 아이콘
      let icon = "🧹";

      if (job.name.startsWith("desk")) {
        icon = "🪑";
      } else if (job.name.startsWith("sweep")) {
        icon = "🧹";
      } else if (job.name.startsWith("mop")) {
        icon = "🧽";
      } else if (job.name.startsWith("wash")) {
        icon = "🪣";
      } else if (job.name === "window") {
        icon = "🪟";
      }


      jobTitle.innerHTML = `
        <span class="overview-job-icon">
          ${icon}
        </span>

        <span>
          ${job.label.replace(area, "").trim()}
        </span>
      `;


      jobBox.appendChild(jobTitle);


      // 학생들
      const studentBox =
        document.createElement("div");

      studentBox.className =
        "overview-area-students";


      students.forEach((student) => {

        const studentNumber =
          studentOrder.indexOf(student.name) + 1;


        const studentTag =
          document.createElement("span");

        studentTag.className =
          "overview-student-tag";


        studentTag.textContent =
          `${studentNumber}번 ${student.name}`;


        studentBox.appendChild(studentTag);

      });


      jobBox.appendChild(studentBox);

      areaCard.appendChild(jobBox);

    });


    areaGrid.appendChild(areaCard);

  });

}


// ==========================================
// 한눈에 보기 팝업 열기
// ==========================================

openOverviewBtn.addEventListener("click", () => {

  renderOverview();

  overviewModal.classList.add("show");

});


// ==========================================
// 팝업 닫기
// ==========================================

closeOverviewBtn.addEventListener("click", () => {

  overviewModal.classList.remove("show");

});


// ==========================================
// 팝업 바깥 클릭
// ==========================================

overviewModal.addEventListener("click", (event) => {

  if (event.target === overviewModal) {

    overviewModal.classList.remove("show");

  }

});


// ==========================================
// ESC로 닫기
// ==========================================

document.addEventListener("keydown", (event) => {

  if (event.key === "Escape") {

    overviewModal.classList.remove("show");

  }

});


// ==========================================
// 번호순
// ==========================================

sortNumberBtn.addEventListener("click", () => {

  overviewSortMode = "number";


  sortNumberBtn.classList.add("active");

  sortAreaBtn.classList.remove("active");


  renderOverview();

});


// ==========================================
// 구역순
// ==========================================

sortAreaBtn.addEventListener("click", () => {

  overviewSortMode = "area";


  sortAreaBtn.classList.add("active");

  sortNumberBtn.classList.remove("active");


  renderOverview();

});