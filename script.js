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

const JOBS = {
  desk: 4,
  sweep: 4,
  mop: 2,
  wash: 2,
};

// ==========================================
// 학생 설정
// ==========================================

const MAX_STUDENTS = 35;
const TOTAL_SELECTED = 12;

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

const deskResult = document.getElementById("deskResult");

const sweepResult = document.getElementById("sweepResult");

const mopResult = document.getElementById("mopResult");

const washResult = document.getElementById("washResult");

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
          desk: data.desk || 0,
          sweep: data.sweep || 0,
          mop: data.mop || 0,
          wash: data.wash || 0,
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

        total: oldData.total,

        desk: oldData.desk,

        sweep: oldData.sweep,

        mop: oldData.mop,

        wash: oldData.wash,
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

async function getStudentData() {
  const snapshot = await getDocs(collection(db, "students"));

  const students = [];

  snapshot.forEach((studentDoc) => {
    const data = studentDoc.data();

    students.push({
      id: studentDoc.id,

      name: data.name,

      total: data.total || 0,

      desk: data.desk || 0,

      sweep: data.sweep || 0,

      mop: data.mop || 0,

      wash: data.wash || 0,
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

    // 현재 남아있는 학생들의 평균 청소 횟수
    const totalCount = remaining.reduce(
      (sum, student) => sum + (student.total || 0),
      0
    );

    const average =
      remaining.length === 0
        ? 0
        : totalCount / remaining.length;

    // 학생별 가중치 계산
    const weightedStudents = remaining.map((student) => {

      const weight = calculateWeight(
        student,
        average
      );

      return {
        student: student,
        weight: weight
      };

    });

    // 전체 가중치
    const weightSum = weightedStudents.reduce(
      (sum, item) => sum + item.weight,
      0
    );

    // 랜덤 선택
    let random = Math.random() * weightSum;

    let selectedIndex = 0;

    for (let i = 0; i < weightedStudents.length; i++) {

      random -= weightedStudents[i].weight;

      if (random <= 0) {
        selectedIndex = i;
        break;
      }

    }

    // 선택된 학생
    const chosen =
      weightedStudents[selectedIndex].student;

    selected.push(chosen);

    // 선택된 학생을 후보에서 제거
    const index =
      remaining.indexOf(chosen);

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

    const shuffled = shuffle(selected);

    const desk = shuffled.slice(0, 4);

    const sweep = shuffled.slice(4, 8);

    const mop = shuffled.slice(8, 10);

    const wash = shuffled.slice(10, 12);

    currentAssignment = {
      desk,
      sweep,
      mop,
      wash,
    };

    // ----------------------------------------
    // 결과 표시
    // ----------------------------------------

    setTimeout(() => {
      displayResult(desk, sweep, mop, wash);

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

function displayResult(desk, sweep, mop, wash) {
  displayStudents(deskResult, desk);

  displayStudents(sweepResult, sweep);

  displayStudents(mopResult, mop);

  displayStudents(washResult, wash);
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
  deskResult.innerHTML = "";

  sweepResult.innerHTML = "";

  mopResult.innerHTML = "";

  washResult.innerHTML = "";

  drawMessage.textContent = "학생 12명을 입력한 후 배정 버튼을 눌러주세요.";
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

loadStudentsFromFirebase();

async function confirmAssignment() {
  if (!currentAssignment) {
    alert("먼저 청소 배정을 해주세요.");

    return;
  }

  const answer = confirm(
    "오늘의 청소 배정을 확정할까요?\n확정하면 학생들의 청소 횟수가 올라갑니다.",
  );

  if (!answer) return;

  confirmResultBtn.disabled = true;
  confirmResultBtn.textContent = "저장 중...";

  try {
    const jobs = [
      {
        name: "desk",
        students: currentAssignment.desk,
      },

      {
        name: "sweep",
        students: currentAssignment.sweep,
      },

      {
        name: "mop",
        students: currentAssignment.mop,
      },

      {
        name: "wash",
        students: currentAssignment.wash,
      },
    ];

    for (const job of jobs) {
      for (const student of job.students) {
        if (!student.id) {
          continue;
        }

        await updateDoc(doc(db, "students", student.id), {
          total: (student.total || 0) + 1,

          [job.name]: (student[job.name] || 0) + 1,
        });
      }
    }

    alert("오늘의 청소 배정이 확정되었습니다.");

    drawMessage.textContent = "✅ 오늘의 청소 배정이 확정되었습니다.";

    confirmResultBtn.textContent = "✅ 배정 완료";

    currentAssignment = null;
  } catch (error) {
    console.error("배정 확정 실패:", error);

    alert("배정 기록 저장에 실패했습니다.");

    confirmResultBtn.disabled = false;

    confirmResultBtn.textContent = "✅ 배정 확정";
  }
}

confirmResultBtn.addEventListener("click", confirmAssignment);

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

  const inputs =
    [
      ...document.querySelectorAll(
        ".exclude-input"
      )
    ];

  return inputs
    .map(input =>
      input.value.trim()
    )
    .filter(name =>
      name !== ""
    );
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

async function loadStatistics() {
  try {
    const students = await getStudentData();

    if (students.length === 0) {
      statsList.innerHTML = "<p>학생 명단이 없습니다.</p>";

      return;
    }

    // 전체 청소 횟수
    const totalCount = students.reduce(
      (sum, student) => sum + (student.total || 0),
      0,
    );

    // 전체 평균 청소 횟수
    const average = totalCount / students.length;

    // 학생별 가중치 계산
    const weightedStudents = students.map((student) => {
      return {
        student: student,

        weight: calculateWeight(student, average),
      };
    });

    // 전체 가중치
    const totalWeight = weightedStudents.reduce(
      (sum, item) => sum + item.weight,
      0,
    );

    // 학생별 통계
    const statistics = weightedStudents.map((item) => {
      const probability =
        totalWeight === 0 ? 0 : (item.weight / totalWeight) * 100;

      return {
        name: item.student.name,

        total: item.student.total || 0,

        probability: probability,

        weight: item.weight,
      };
    });

    // 확률이 높은 순서
    statistics.sort((a, b) => b.probability - a.probability);

    statsList.innerHTML = "";

    // 화면에 표시
    statistics.forEach((stat) => {
      const row = document.createElement("div");

      row.className = "stat-row";

      // 이름
      const name = document.createElement("div");

      name.className = "stat-name";

      name.textContent = stat.name;

      // 막대 배경
      const barContainer = document.createElement("div");

      barContainer.className = "stat-bar-container";

      // 막대
      const bar = document.createElement("div");

      bar.className = "stat-bar";

      bar.style.width = `${Math.min(stat.probability * 5, 100)}%`;

      barContainer.appendChild(bar);

      // 확률
      const percent = document.createElement("div");

      percent.className = "stat-percent";

      percent.textContent = `${stat.probability.toFixed(1)}%`;

      // 청소 횟수
      const total = document.createElement("div");

      total.className = "stat-total";

      total.textContent = `${stat.total}회`;

      // 가중치
      const weight = document.createElement("div");

      weight.className = "stat-weight";

      weight.textContent = `유리도 ${stat.weight}`;

      row.appendChild(name);

      row.appendChild(barContainer);

      row.appendChild(percent);

      row.appendChild(total);

      row.appendChild(weight);

      statsList.appendChild(row);
    });
  } catch (error) {
    console.error("통계 불러오기 실패:", error);

    statsList.innerHTML = "<p>통계를 불러오지 못했습니다.</p>";
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
          total: 0,
          desk: 0,
          sweep: 0,
          mop: 0,
          wash: 0,
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