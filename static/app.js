const pageNames = ["home", "homework", "calendar", "grades", "profile"];

function showSection(name) {

    const profileSection = document.getElementById("profileSection");
    if (profileSection) {
        profileSection.hidden = name !== "profile";
    }

    if (!pageNames.includes(name)) return;

    document.querySelectorAll(
        ".header, .welcome, .feature-cards"
    ).forEach(element => {
        element.hidden = name !== "home";
    });

    const homeworkSection = document.getElementById("homeworkSection");

    if (homeworkSection) {
        homeworkSection.hidden = name !== "homework";
    }

    const gradesSection = document.getElementById("gradesSection");

    if (gradesSection) {
        gradesSection.hidden = name !== "grades";
    }
    const calendarSection = document.getElementById("calendarSection");

if (calendarSection) {
    calendarSection.hidden = name !== "calendar";
    if (name === "calendar") {
        renderCalendar();
    }

const profileSection = document.getElementById("profileSection");
if (profileSection) {
    profileSection.hidden = name !== "profile";
}

}
    document.querySelectorAll(".nav-item").forEach((button, index) => {
        button.classList.toggle("active", pageNames[index] === name);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

const HOMEWORK_STORAGE_KEY = "homeworkMiniAppTasks";

const weekdayNames = [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота"
];

function getHomeworkTasks() {
    try {
        const tasks = JSON.parse(
            localStorage.getItem(HOMEWORK_STORAGE_KEY) || "[]"
        );
        return Array.isArray(tasks) ? tasks : [];
    } catch {
        return [];
    }
}

function saveHomeworkTasks(tasks) {
    localStorage.setItem(HOMEWORK_STORAGE_KEY, JSON.stringify(tasks));
}

function toggleHomeworkForm() {
    const form = document.getElementById("homeworkForm");
    if (!form) return;

    form.hidden = !form.hidden;

    if (!form.hidden) {
        document.getElementById("homeworkSubject").focus();
    }
}

function createHomeworkCard(task) {
    const card = document.createElement("article");
    card.className = "homework-card-item";

    const subject = document.createElement("h3");
    subject.textContent = task.subject;

    const description = document.createElement("p");
    description.textContent = task.description;

    const day = document.createElement("small");
    day.textContent = weekdayNames[Number(task.day)] || "День не указан";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "delete-homework-button";
    removeButton.textContent = "Удалить";


    removeButton.addEventListener("click", () => {
        const tasks = getHomeworkTasks().filter(item => item.id !== task.id);
        saveHomeworkTasks(tasks);
        renderHomework();

        const calendarSection = document.getElementById("calendarSection");
        if (calendarSection && !calendarSection.hidden) {
        renderCalendar();
        }
    });


    card.append(subject, description, day, removeButton);
    return card;
}

function renderHomework() {
    const tomorrowContainer = document.getElementById("tomorrowHomework");
    const allContainer = document.getElementById("allHomework");

    if (!tomorrowContainer || !allContainer) return;

    const tasks = getHomeworkTasks();
    const tomorrowDay = (new Date().getDay() + 1) % 7;
    const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];

    tasks.sort((a, b) =>
        weekdayOrder.indexOf(Number(a.day)) -
        weekdayOrder.indexOf(Number(b.day))
    );

    tomorrowContainer.replaceChildren();
    allContainer.replaceChildren();

    const tomorrowTasks = tasks.filter(
        task => Number(task.day) === tomorrowDay
    );

    if (tomorrowTasks.length === 0) {
        tomorrowContainer.textContent = "На завтра заданий нет.";
    } else {
        tomorrowTasks.forEach(task => {
            tomorrowContainer.appendChild(createHomeworkCard(task));
        });
    }

    if (tasks.length === 0) {
        allContainer.textContent = "Пока заданий нет. Добавь первое!";
    } else {
        tasks.forEach(task => {
            allContainer.appendChild(createHomeworkCard(task));
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("homeworkForm");

    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();

            const subject = document.getElementById("homeworkSubject").value;
            const description = document.getElementById("homeworkDescription").value.trim();
            const day = document.getElementById("homeworkDay").value;

            if (!subject || !description || day === "") return;

            const tasks = getHomeworkTasks();

            tasks.push({
                id: `${Date.now()}-${Math.random()}`,
                subject,
                description,
                day: Number(day)
            });

            saveHomeworkTasks(tasks);
            form.reset();
            form.hidden = true;
            renderHomework();
        });
    }

    showSection("home");
    renderHomework();
});

const GRADES_STORAGE_KEY = "homeworkMiniAppGrades";

function getGrades() {
    try {
        const grades = JSON.parse(
            localStorage.getItem(GRADES_STORAGE_KEY) || "[]"
        );
        return Array.isArray(grades) ? grades : [];
    } catch {
        return [];
    }
}

function saveGrades(grades) {
    localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(grades));
}

function toggleGradeForm() {
    const form = document.getElementById("gradeForm");
    if (!form) return;

    form.hidden = !form.hidden;

    if (!form.hidden) {
        document.getElementById("gradeSubject").focus();
    }
}

function renderGrades() {
    const tbody = document.getElementById("gradesTableBody");
    const emptyMessage = document.getElementById("gradesEmptyMessage");

    if (!tbody || !emptyMessage) return;

    const grades = getGrades();
    const subjects = [...new Set(grades.map(item => item.subject))];

    tbody.replaceChildren();
    emptyMessage.hidden = grades.length > 0;

    subjects.forEach(subjectName => {
        const subjectGrades = grades.filter(
            item => item.subject === subjectName
        );

        const values = subjectGrades.map(item => Number(item.value));
        const average = values.reduce((sum, value) => sum + value, 0)
            / values.length;

        const row = document.createElement("tr");

        const subjectCell = document.createElement("td");
        subjectCell.textContent = subjectName;

        const gradesCell = document.createElement("td");

        subjectGrades.forEach(item => {
            const gradeButton = document.createElement("button");
            gradeButton.type = "button";
            gradeButton.className = "grade-chip";
            gradeButton.textContent = item.value;
            gradeButton.title = "Нажми, чтобы удалить оценку";

            gradeButton.addEventListener("click", () => {
                const updated = getGrades().filter(
                    grade => grade.id !== item.id
                );
                saveGrades(updated);
                renderGrades();
            });

            gradesCell.appendChild(gradeButton);
        });

        const averageCell = document.createElement("td");
        averageCell.className = "grade-average";
        averageCell.textContent = average.toLocaleString("ru-RU", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        row.append(subjectCell, gradesCell, averageCell);
        tbody.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("gradeForm");
    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const subject = document.getElementById("gradeSubject").value;
        const value = Number(document.getElementById("gradeValue").value);

        if (!subject || ![2, 3, 4, 5].includes(value)) return;

        const grades = getGrades();

        grades.push({
            id: `${Date.now()}-${Math.random()}`,
            subject,
            value
        });

        saveGrades(grades);
        form.reset();
        form.hidden = true;
        renderGrades();
    });

    renderGrades();
});

const calendarWeekdays = [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота"
];

let selectedCalendarDay = 1;

function renderCalendar() {
    const list = document.getElementById("calendarHomeworkList");
    const title = document.getElementById("calendarDayTitle");

    if (!list || !title) return;

    title.textContent = `Задания на ${calendarWeekdays[selectedCalendarDay].toLowerCase()}`;
    list.replaceChildren();

    document.querySelectorAll(".calendar-day").forEach(button => {
        button.classList.toggle(
            "active",
            Number(button.dataset.day) === selectedCalendarDay
        );
    });

    const tasks = getHomeworkTasks().filter(
        task => Number(task.day) === selectedCalendarDay
    );

    if (tasks.length === 0) {
        list.textContent = "На этот день заданий пока нет.";
        return;
    }

    tasks.forEach(task => {
        list.appendChild(createHomeworkCard(task));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".calendar-day").forEach(button => {
        button.addEventListener("click", () => {
            selectedCalendarDay = Number(button.dataset.day);
            renderCalendar();
        });
    });
});

function initTelegramProfile() {
    const telegram = window.Telegram?.WebApp;

    if (!telegram) {
        console.log("Telegram Web App SDK не найден");
        return;
    }

    telegram.ready();
    telegram.expand();

    const user = telegram.initDataUnsafe?.user;

    if (!user) {
        console.log("Открой приложение через Telegram, чтобы получить профиль");
        return;
    }

    const firstNameInput = document.getElementById("profileFirstName");
    const lastNameInput = document.getElementById("profileLastName");
    const fullName = document.getElementById("profileFullName");
    const username = document.getElementById("profileUsername");
    const avatar = document.getElementById("profileAvatar");
    const placeholder = document.getElementById("profileAvatarPlaceholder");

    if (firstNameInput) firstNameInput.value = user.first_name || "";
    if (lastNameInput) lastNameInput.value = user.last_name || "";

    if (fullName) {
        fullName.textContent =
            [user.first_name, user.last_name].filter(Boolean).join(" ") || "Твой профиль";
    }

    if (username) {
        username.textContent = user.username ? "@" + user.username : "Ученик";
    }

    if (user.photo_url && avatar && placeholder) {
        avatar.src = user.photo_url;
        avatar.hidden = false;
        placeholder.hidden = true;
    }
}

document.addEventListener("DOMContentLoaded", initTelegramProfile);

const PROFILE_STORAGE_KEY = "homeworkMiniAppProfile";

function loadSavedProfile() {
    try {
        return JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function updateProfilePreview() {
    const firstName = document.getElementById("profileFirstName")?.value.trim() || "";
    const lastName = document.getElementById("profileLastName")?.value.trim() || "";
    const fullName = document.getElementById("profileFullName");

    if (fullName) {
        fullName.textContent = [firstName, lastName].filter(Boolean).join(" ") || "Твой профиль";
    }
}

function updateHomeProfile() {
    const saved = loadSavedProfile();
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    const firstName = saved.firstName || telegramUser?.first_name || "";
    const lastName = saved.lastName || telegramUser?.last_name || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    const userName = document.getElementById("userName");
    const homeAvatar = document.getElementById("homeProfileAvatar");

function updateHomeProfile() {
    const saved = loadSavedProfile();
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    const firstName = saved.firstName || telegramUser?.first_name || "";
    const lastName = saved.lastName || telegramUser?.last_name || "";

    const userName = document.getElementById("userName");
    const homeAvatar = document.getElementById("homeProfileAvatar");

    if (userName) {
        userName.textContent =
            [firstName, lastName].filter(Boolean).join(" ") || "Имя Фамилия";
    }

    if (homeAvatar) {
        const photo = saved.avatar;

        if (photo) {
            homeAvatar.textContent = "";
            homeAvatar.style.backgroundImage = `url("${photo}")`;
            homeAvatar.style.backgroundSize = "cover";
            homeAvatar.style.backgroundPosition = "center";
        } else {
            homeAvatar.textContent = "HM";
            homeAvatar.style.backgroundImage = "none";
        }
    }
}


    if (userName) {
        userName.textContent = fullName || "Имя Фамилия";
    }

    if (homeAvatar) {
        const photo = saved.avatar || telegramUser?.photo_url;

        if (photo) {
            homeAvatar.textContent = "";
            homeAvatar.style.backgroundImage = `url("${photo}")`;
            homeAvatar.style.backgroundSize = "cover";
            homeAvatar.style.backgroundPosition = "center";
            homeAvatar.style.borderRadius = "50%";
        } else {
            homeAvatar.textContent = "HM";
            homeAvatar.style.backgroundImage = "none";
        }
    }
}
document.addEventListener("DOMContentLoaded", updateHomeProfile);

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("profileForm");
    const firstNameInput = document.getElementById("profileFirstName");
    const lastNameInput = document.getElementById("profileLastName");
    const avatarInput = document.getElementById("avatarInput");
    const avatar = document.getElementById("profileAvatar");
    const placeholder = document.getElementById("profileAvatarPlaceholder");

    if (!form || !firstNameInput || !lastNameInput) return;

    const saved = loadSavedProfile();

    if (saved.firstName) firstNameInput.value = saved.firstName;
    if (saved.lastName) lastNameInput.value = saved.lastName;

    if (saved.avatar && avatar && placeholder) {
        avatar.src = saved.avatar;
        avatar.hidden = false;
        placeholder.hidden = true;
    }

    updateProfilePreview();

    firstNameInput.addEventListener("input", updateProfilePreview);
    lastNameInput.addEventListener("input", updateProfilePreview);

    form.addEventListener("submit", event => {
        event.preventDefault();

        const profile = loadSavedProfile();
        profile.firstName = firstNameInput.value.trim();
        profile.lastName = lastNameInput.value.trim();

        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        updateProfilePreview();

        alert("Профиль сохранён!");
    });

    if (avatarInput) {
        avatarInput.addEventListener("change", () => {
            const file = avatarInput.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                alert("Выбери файл изображения.");
                avatarInput.value = "";
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                alert("Фотография должна быть не больше 2 МБ.");
                avatarInput.value = "";
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                const profile = loadSavedProfile();
                profile.avatar = reader.result;


                try {
                    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
                    updateHomeProfile();

                    if (avatar && placeholder) {
                        avatar.src = reader.result;
                        avatar.hidden = false;
                        placeholder.hidden = true;
                    }
                    if (avatar && placeholder) {
                        avatar.src = reader.result;
                        avatar.hidden = false;
                        placeholder.hidden = true;
                    }

                    if (avatar && placeholder) {
                        avatar.src = reader.result;
                        avatar.hidden = false;
                        placeholder.hidden = true;
                    }

                    updateHomeProfile();

                } catch {
                    alert("Не удалось сохранить фото. Попробуй изображение поменьше.");
                }
            };

            reader.readAsDataURL(file);
        });
    }
});


function updateHomeProfile() {
    const saved = loadSavedProfile();
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    const firstName = saved.firstName || telegramUser?.first_name || "";
    const lastName = saved.lastName || telegramUser?.last_name || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    const userName = document.getElementById("userName");
    const homeAvatar = document.getElementById("homeProfileAvatar");

    if (userName) {
        userName.textContent = fullName || "Имя Фамилия";
    }

    if (homeAvatar) {
        const photo = saved.avatar || telegramUser?.photo_url;

        if (photo) {
            homeAvatar.textContent = "";
            homeAvatar.style.backgroundImage = `url("${photo}")`;
            homeAvatar.style.backgroundSize = "cover";
            homeAvatar.style.backgroundPosition = "center";
        } else {
            homeAvatar.textContent = "HM";
            homeAvatar.style.backgroundImage = "none";
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("profileForm");
    const firstNameInput = document.getElementById("profileFirstName");
    const lastNameInput = document.getElementById("profileLastName");
    const avatarInput = document.getElementById("avatarInput");
    const avatar = document.getElementById("profileAvatar");
    const placeholder = document.getElementById("profileAvatarPlaceholder");

    if (!form || !firstNameInput || !lastNameInput) return;

    const saved = loadSavedProfile();

    if (saved.firstName) firstNameInput.value = saved.firstName;
    if (saved.lastName) lastNameInput.value = saved.lastName;

    if (saved.avatar && avatar && placeholder) {
        avatar.src = saved.avatar;
        avatar.hidden = false;
        placeholder.hidden = true;
    }

    updateProfilePreview();
    updateHomeProfile();

    firstNameInput.addEventListener("input", updateProfilePreview);
    lastNameInput.addEventListener("input", updateProfilePreview);

    form.addEventListener("submit", event => {
        event.preventDefault();

        const profile = loadSavedProfile();
        profile.firstName = firstNameInput.value.trim();
        profile.lastName = lastNameInput.value.trim();

        localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify(profile)
        );

        updateProfilePreview();
        updateHomeProfile();

        alert("Профиль сохранён!");
    });

    if (avatarInput) {
        avatarInput.addEventListener("change", () => {
            const file = avatarInput.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                alert("Выбери файл изображения.");
                avatarInput.value = "";
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                alert("Фотография должна быть не больше 2 МБ.");
                avatarInput.value = "";
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                const profile = loadSavedProfile();
                profile.avatar = reader.result;

                try {
                    localStorage.setItem(
                        PROFILE_STORAGE_KEY,
                        JSON.stringify(profile)
                    );

                    if (avatar && placeholder) {
                        avatar.src = reader.result;
                        avatar.hidden = false;
                        placeholder.hidden = true;
                    }

                    updateHomeProfile();
                } catch (error) {
                    alert("Не удалось сохранить фото. Попробуй изображение поменьше.");
                }
            };

            reader.readAsDataURL(file);
        });
    }
});

document.addEventListener("DOMContentLoaded", updateHomeProfile);




