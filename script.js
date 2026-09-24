/* =========================================================
   DIGITAL NOTES ORGANISER - STEP 4
   Search + Subject Filter + Sort + Date & Time
   ========================================================= */


const SUPABASE_URL = "https://xftimbkmduzjgqxfhbxx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QyaRDxNd6ix5cbsmijOS4g_sxf_jrE2";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
   /* ================= STORAGE ================= */

let notes = JSON.parse(localStorage.getItem("dnoNotes")) || [];
async function loadCloudNotes() {

    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("notes")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading notes:", error);
        return;
    }

    notes = data.map(note => ({

        id: note.id,

        subject: note.subject,

        title: note.title,

        content: note.content,

        important: note.important,

        date: new Date(note.created_at)
            .toLocaleString("en-IN", {

                day: "2-digit",

                month: "short",

                year: "numeric",

                hour: "2-digit",

                minute: "2-digit"

            })

    }));

    updateDashboard();
    updateSubjectCounts();
    displayAllNotes();
    displayImportantNotes();

}
let noteToDelete = null;
let noteBeingEdited = null;
let currentSubject = null;


function saveToStorage() {
    localStorage.setItem("dnoNotes", JSON.stringify(notes));
}


/* ================= SECTIONS ================= */

const sections = [
    "dashboardSection",
    "subjectsSection",
    "subjectDetailSection",
    "allNotesSection",
    "importantSection",
    "settingsSection"
];


function hideAllSections() {

    sections.forEach(id => {

        const section = document.getElementById(id);

        if (section) {
            section.classList.add("hidden");
        }

    });
}


function showSection(id) {

    hideAllSections();

    const section = document.getElementById(id);

    if (section) {
        section.classList.remove("hidden");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* ================= SIDEBAR ================= */

function updateActiveNav(index) {

    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {
        item.classList.remove("active");
    });

    if (navItems[index]) {
        navItems[index].classList.add("active");
    }
}


function toggleSidebar() {

    const sidebar = document.getElementById("sidebar");

    if (sidebar) {
        sidebar.classList.toggle("mobile-open");
    }
}


/* ================= DASHBOARD ================= */

function showDashboard() {

    showSection("dashboardSection");

    updateActiveNav(0);

    updateDashboard();

    if (window.innerWidth <= 700) {
        toggleSidebar();
    }
}


/* ================= SUBJECTS ================= */

function showSubjects() {

    showSection("subjectsSection");

    updateActiveNav(1);

    updateSubjectCounts();

    if (window.innerWidth <= 700) {
        toggleSidebar();
    }
}


/* ================= OPEN SUBJECT ================= */

function openSubject(subjectName) {

    currentSubject = subjectName;

    showSection("subjectDetailSection");

    updateActiveNav(1);

    const title =
        document.getElementById("subjectDetailTitle");

    const description =
        document.getElementById("subjectDetailDescription");

    const small =
        document.getElementById("subjectDetailSmall");


    if (title) {
        title.textContent = subjectName;
    }

    if (description) {
        description.textContent =
            "Manage all notes for " + subjectName + ".";
    }

    if (small) {
        small.textContent = "SUBJECT NOTES";
    }

    displaySubjectNotes(subjectName);

    if (window.innerWidth <= 700) {
        toggleSidebar();
    }
}


/* ================= SUBJECT NOTES ================= */

function displaySubjectNotes(subjectName) {

    const grid =
        document.getElementById("subjectNotesGrid");

    if (!grid) return;


    const subjectNotes =
        notes.filter(note =>
            note.subject === subjectName
        );


    grid.innerHTML = "";


    if (subjectNotes.length === 0) {

        grid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">📝</div>

                <h3>No Notes Yet</h3>

                <p>
                    This subject does not have any notes yet.
                </p>

                <button
                    class="primary-btn"
                    onclick="openAddNoteForSubject()"
                >
                    + Add First Note
                </button>

            </div>

        `;

        return;
    }


    subjectNotes.forEach(note => {

        grid.innerHTML += createNoteCard(note);

    });
}


/* ================= ADD NOTE ================= */

function openAddNote() {

    const modal =
        document.getElementById("addNoteModal");

    if (modal) {
        modal.classList.remove("hidden");
    }


    document.getElementById("noteSubject").value = "";
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteContent").value = "";
    document.getElementById("noteImportant").checked = false;
}


function openAddNoteForSubject() {

    openAddNote();

    if (currentSubject) {

        document.getElementById("noteSubject").value =
            currentSubject;
    }
}


function closeAddNote() {

    document.getElementById("addNoteModal")
        .classList.add("hidden");
}


/* ================= SAVE NOTE ================= */

async function saveNote() {

    const subject =
        document.getElementById("noteSubject").value;

    const title =
        document.getElementById("noteTitle").value.trim();

    const content =
        document.getElementById("noteContent").value.trim();

    const important =
        document.getElementById("noteImportant").checked;


    if (!subject || !title || !content) {

        showMessage(
            "Missing Information",
            "Please fill all the required fields."
        );

        return;
    }


    const {
        data: { user },
        error: userError
    } = await supabaseClient.auth.getUser();


    if (userError || !user) {

        showMessage(
            "Login Required",
            "Please login before saving a note."
        );

        return;
    }


    const { data, error } =
        await supabaseClient
            .from("notes")
            .insert({

                user_id: user.id,

                subject: subject,

                title: title,

                content: content,

                important: important

            })
            .select()
            .single();


    if (error) {

        console.error(error);

        showMessage(
            "Save Failed",
            error.message
        );

        return;
    }


    notes.unshift({

        id: data.id,

        subject: data.subject,

        title: data.title,

        content: data.content,

        important: data.important,

        date: new Date(data.created_at)
            .toLocaleString("en-IN", {

                day: "2-digit",

                month: "short",

                year: "numeric",

                hour: "2-digit",

                minute: "2-digit"

            })

    });


    closeAddNote();

    updateDashboard();

    updateSubjectCounts();

    displayAllNotes();

    displayImportantNotes();


    if (currentSubject === subject) {

        displaySubjectNotes(currentSubject);

    }


    showMessage(
        "Note Saved!",
        "Your note has been successfully saved to the cloud."
    );
}


/* ================= DASHBOARD UPDATE ================= */

function updateDashboard() {

    const totalNotes =
        document.getElementById("totalNotes");

    const importantNotes =
        document.getElementById("importantNotes");

    const totalSubjects =
        document.getElementById("totalSubjects");


    if (totalNotes) {
        totalNotes.textContent = notes.length;
    }

    if (importantNotes) {

        importantNotes.textContent =
            notes.filter(note => note.important).length;
    }

    if (totalSubjects) {
        totalSubjects.textContent = "8";
    }

    document.getElementById("settingsTotalNotes").textContent =
        notes.length;

    document.getElementById("settingsImportantNotes").textContent =
        notes.filter(note => note.important).length;

    document.getElementById("settingsSubjects").textContent =
        8;
    updateSubjectCounts();

    updateRecentNotes();
}


/* ================= RECENT NOTES ================= */

function updateRecentNotes() {

    const grid =
        document.getElementById("recentNotesGrid");

    if (!grid) return;


    const recentNotes =
        notes.slice(0, 6);


    grid.innerHTML = "";


    if (recentNotes.length === 0) {

        grid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">📝</div>

                <h3>No Notes Yet</h3>

                <p>
                    Your latest notes will appear here.
                </p>

            </div>

        `;

        return;
    }


    recentNotes.forEach(note => {

        grid.innerHTML += createNoteCard(note);

    });
}


/* ================= SUBJECT COUNTS ================= */

function updateSubjectCounts() {

    const subjectMap = {

        "Mathematics for Signal Analysis":
            [
                "count-Mathematics",
                "subject-count-Mathematics"
            ],

        "Electronic Devices and Linear Circuits":
            [
                "count-Electronic",
                "subject-count-Electronic"
            ],

        "Digital System Design":
            [
                "count-DSD",
                "subject-count-DSD"
            ],

        "Environmental Science":
            [
                "count-EVS",
                "subject-count-EVS"
            ],

        "Entrepreneurship Development":
            [
                "count-ENTP",
                "subject-count-ENTP"
            ],

        "Network Theory and Control System":
            [
                "count-NTCS",
                "subject-count-NTCS"
            ],

        "Digital Marketing":
            [
                "count-DM",
                "subject-count-DM"
            ],

        "C++ and Java Programming":
            [
                "count-CPP",
                "subject-count-CPP"
            ]

    };


    Object.keys(subjectMap).forEach(subject => {

        const count =
            notes.filter(note =>
                note.subject === subject
            ).length;


        subjectMap[subject].forEach(id => {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    count +
                    (count === 1 ? " Note" : " Notes");
            }

        });

    });
}


/* ================= NOTE CARD ================= */

function createNoteCard(note) {

    const safeTitle =
        escapeHTML(note.title);

    const safeSubject =
        escapeHTML(note.subject);

    const safeContent =
        escapeHTML(note.content);


    const shortContent =
        safeContent.length > 120
            ? safeContent.substring(0, 120) + "..."
            : safeContent;


    return `

        <div class="note-card ${note.important ? "important" : ""}">

            <div class="note-card-header">

                <h3>
                    ${note.important ? "⭐ " : ""}
                    ${safeTitle}
                </h3>

            </div>


            <div class="note-subject">

                ${safeSubject}

            </div>


            <div class="note-preview">

                ${shortContent}

            </div>


            <div class="note-footer">

                <span class="note-date">

                    📅 ${escapeHTML(note.date || "Date unavailable")}

                </span>


                <div class="note-actions">

                    <button
                        class="note-action-btn"
                        onclick="viewNote(${note.id})"
                    >
                        View
                    </button>


                    <button
                        class="note-action-btn"
                        onclick="editNote(${note.id})"
                    >
                        Edit
                    </button>


                    <button
                        class="note-action-btn delete"
                        onclick="deleteNote(${note.id})"
                    >
                        Delete
                    </button>

                </div>

            </div>

        </div>

    `;
}


/* ================= VIEW NOTE ================= */

function viewNote(id) {

    const note =
        notes.find(note => note.id === id);

    if (!note) return;


    document.getElementById("viewNoteTitle").textContent =
        note.title;

    document.getElementById("viewNoteSubject").textContent =
        note.subject;

    document.getElementById("viewNoteContent").textContent =
        note.content;

    document.getElementById("viewNoteDate").textContent =
        "📅 " + (note.date || "Date unavailable");


    document.getElementById("viewNoteModal")
        .classList.remove("hidden");
}


function closeViewNote() {

    document.getElementById("viewNoteModal")
        .classList.add("hidden");
}


/* ================= EDIT NOTE ================= */

function editNote(id) {

    const note =
        notes.find(note => note.id === id);

    if (!note) return;


    noteBeingEdited = id;


    document.getElementById("editNoteSubject").value =
        note.subject;

    document.getElementById("editNoteTitle").value =
        note.title;

    document.getElementById("editNoteContent").value =
        note.content;

    document.getElementById("editNoteImportant").checked =
        note.important;


    document.getElementById("editNoteModal")
        .classList.remove("hidden");
}


function closeEditNote() {

    document.getElementById("editNoteModal")
        .classList.add("hidden");

    noteBeingEdited = null;
}


async function updateNote() {

    if (noteBeingEdited === null) return;


    const note =
        notes.find(note =>
            note.id === noteBeingEdited
        );


    if (!note) return;


    const subject =
        document.getElementById("editNoteSubject").value;

    const title =
        document.getElementById("editNoteTitle").value.trim();

    const content =
        document.getElementById("editNoteContent").value.trim();

    const important =
        document.getElementById("editNoteImportant").checked;


    if (!subject || !title || !content) {

        showMessage(
            "Missing Information",
            "Please fill all the required fields."
        );

        return;
    }


    const { data, error } =
        await supabaseClient
            .from("notes")
            .update({

                subject: subject,

                title: title,

                content: content,

                important: important

            })
            .eq("id", noteBeingEdited)
            .select()
            .single();


    if (error) {

        console.error(error);

        showMessage(
            "Update Failed",
            error.message
        );

        return;
    }


    note.subject = data.subject;

    note.title = data.title;

    note.content = data.content;

    note.important = data.important;


    closeEditNote();

    updateDashboard();

    updateSubjectCounts();

    displayAllNotes();

    displayImportantNotes();


    if (currentSubject) {

        displaySubjectNotes(currentSubject);
    }


    showMessage(
        "Note Updated!",
        "Your note has been successfully updated in the cloud."
    );
}


/* ================= DELETE ================= */

function deleteNote(id) {

    noteToDelete = id;


    document.getElementById("deleteModal")
        .classList.remove("hidden");
}


function closeDeleteModal() {

    document.getElementById("deleteModal")
        .classList.add("hidden");

    noteToDelete = null;
}


async function confirmDelete() {

    if (noteToDelete === null) return;


    const { error } =
        await supabaseClient
            .from("notes")
            .delete()
            .eq("id", noteToDelete);


    if (error) {

        console.error(error);

        showMessage(
            "Delete Failed",
            error.message
        );

        return;
    }


    notes =
        notes.filter(note =>
            note.id !== noteToDelete
        );


    closeDeleteModal();

    updateDashboard();

    updateSubjectCounts();

    displayAllNotes();

    displayImportantNotes();


    if (currentSubject) {

        displaySubjectNotes(currentSubject);
    }


    showMessage(
        "Note Deleted",
        "The note has been successfully deleted from the cloud."
    );


    noteToDelete = null;
}


/* =========================================================
   ALL NOTES
   ========================================================= */

function showAllNotes() {

    showSection("allNotesSection");

    updateActiveNav(2);

    syncFilterSearch();

    applyNoteFilters();
}


function displayAllNotes() {

    applyNoteFilters();
}


/* =========================================================
   STEP 4 - SEARCH + FILTER + SORT
   ========================================================= */

function applyNoteFilters() {

    const grid =
        document.getElementById("allNotesGrid");

    if (!grid) return;


    const searchInput =
        document.getElementById("notesSearchInput");

    const subjectFilter =
        document.getElementById("subjectFilter");

    const sortFilter =
        document.getElementById("sortFilter");


    const search =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    const selectedSubject =
        subjectFilter
            ? subjectFilter.value
            : "all";


    const sort =
        sortFilter
            ? sortFilter.value
            : "newest";


    let filteredNotes =
        [...notes];


    /* SEARCH */

    if (search) {

        filteredNotes =
            filteredNotes.filter(note =>

                (note.title || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (note.content || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (note.subject || "")
                    .toLowerCase()
                    .includes(search)

            );
    }


    /* SUBJECT FILTER */

    if (selectedSubject !== "all") {

        filteredNotes =
            filteredNotes.filter(note =>
                note.subject === selectedSubject
            );
    }


    /* SORT */

    filteredNotes.sort((a, b) => {

        const timeA =
            Number(a.id) || 0;

        const timeB =
            Number(b.id) || 0;


        if (sort === "oldest") {

            return timeA - timeB;

        }

        return timeB - timeA;

    });


    /* RESULT INFO */

    const resultInfo =
        document.getElementById("notesResultInfo");


    if (resultInfo) {

        if (search || selectedSubject !== "all") {

            resultInfo.textContent =
                `Showing ${filteredNotes.length} of ${notes.length} notes`;

        } else {

            resultInfo.textContent =
                `${filteredNotes.length} notes`;

        }

    }


    grid.innerHTML = "";


    /* EMPTY */

    if (filteredNotes.length === 0) {

        grid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">🔍</div>

                <h3>No Notes Found</h3>

                <p>
                    Try another search term or change the filters.
                </p>

                <button
                    class="secondary-btn"
                    onclick="resetNoteFilters()"
                >
                    Reset Filters
                </button>

            </div>

        `;

        return;
    }


    /* DISPLAY */

    filteredNotes.forEach(note => {

        grid.innerHTML +=
            createNoteCard(note);

    });
}


/* ================= RESET FILTERS ================= */

function resetNoteFilters() {

    const notesSearchInput =
        document.getElementById("notesSearchInput");

    const subjectFilter =
        document.getElementById("subjectFilter");

    const sortFilter =
        document.getElementById("sortFilter");

    const headerSearch =
        document.getElementById("searchInput");


    if (notesSearchInput) {
        notesSearchInput.value = "";
    }

    if (subjectFilter) {
        subjectFilter.value = "all";
    }

    if (sortFilter) {
        sortFilter.value = "newest";
    }

    if (headerSearch) {
        headerSearch.value = "";
    }


    applyNoteFilters();
}


/* ================= SYNC HEADER SEARCH ================= */

function syncFilterSearch() {

    const headerSearch =
        document.getElementById("searchInput");

    const notesSearch =
        document.getElementById("notesSearchInput");


    if (headerSearch && notesSearch) {

        notesSearch.value =
            headerSearch.value;

    }
}


/* ================= HEADER SEARCH ================= */

function searchNotes() {

    const headerSearch =
        document.getElementById("searchInput");

    const notesSearch =
        document.getElementById("notesSearchInput");


    if (!headerSearch) return;


    if (notesSearch) {

        notesSearch.value =
            headerSearch.value;
    }


    showSection("allNotesSection");

    updateActiveNav(2);

    applyNoteFilters();
}


/* =========================================================
   IMPORTANT NOTES
   ========================================================= */

function showImportantNotes() {

    showSection("importantSection");

    updateActiveNav(3);

    displayImportantNotes();
}


function displayImportantNotes() {

    const grid =
        document.getElementById("importantNotesGrid");

    if (!grid) return;


    const importantNotes =
        notes.filter(note =>
            note.important
        );


    grid.innerHTML = "";


    if (importantNotes.length === 0) {

        grid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">⭐</div>

                <h3>No Important Notes</h3>

                <p>
                    Notes marked as important will appear here.
                </p>

            </div>

        `;

        return;
    }


    importantNotes.forEach(note => {

        grid.innerHTML +=
            createNoteCard(note);

    });
}


/* =========================================================
   SETTINGS
   ========================================================= */

function showSettings() {

    showSection("settingsSection");

    updateActiveNav(4);


    const count =
        document.getElementById("settingsNoteCount");

    if (count) {
        count.textContent = notes.length;
    }
}


/* =========================================================
   MESSAGE MODAL
   ========================================================= */

function showMessage(title, message) {

    const messageText =
        document.getElementById("messageText");


    if (messageText) {

        messageText.textContent =
            title + " — " + message;
    }


    const modal =
        document.getElementById("messageModal");

    if (modal) {

        modal.classList.remove("hidden");
    }
}


function closeMessage() {

    const modal =
        document.getElementById("messageModal");

    if (modal) {

        modal.classList.add("hidden");
    }
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;
}


/* =========================================================
   MODAL OUTSIDE CLICK
   ========================================================= */

document.addEventListener("click", function(event) {

    const modals =
        document.querySelectorAll(".modal-overlay");


    modals.forEach(modal => {

        if (
            event.target === modal &&
            !modal.classList.contains("hidden")
        ) {

            modal.classList.add("hidden");

        }

    });

});


/* =========================================================
   INITIAL LOAD
   ========================================================= */

document.addEventListener("DOMContentLoaded", function() {

    updateDashboard();

    updateSubjectCounts();

});
/* ================= LOGIN SYSTEM ================= */

document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const loginScreen = document.getElementById("loginScreen");

    if (!loginForm || !loginScreen) return;

    loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.getElementById("loginUsername").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });


    if (error) {

        alert(error.message);

        return;
    }


    const user = data.user;

    const username =
        user.user_metadata?.username ||
        email.split("@")[0];


    loginScreen.style.display = "none";

    showDashboard();
await loadCloudNotes();

    const profileUsername =
        document.getElementById("profileUsername");

    if (profileUsername) {
        profileUsername.textContent = username;
    }


    const headerUsername =
        document.getElementById("headerUsername");

    if (headerUsername) {
        headerUsername.textContent = username;
    }


    const headerAvatar =
        document.getElementById("headerAvatar");

    if (headerAvatar) {
        headerAvatar.textContent =
            username.charAt(0).toUpperCase();
    }

});
});
/* ================= PROFILE POPUP ================= */

function openProfilePopup() {

    const popup =
        document.getElementById("profilePopupOverlay");

    const popupUsername =
        document.getElementById("popupUsername");

    const popupAvatar =
        document.getElementById("popupAvatar");

    const popupTotalNotes =
        document.getElementById("popupTotalNotes");

    const popupImportantNotes =
        document.getElementById("popupImportantNotes");


    const savedUsername =
        localStorage.getItem("dnoUsername") || "Student";


    if (popupUsername) {
        popupUsername.textContent = savedUsername;
    }


    if (popupAvatar) {
        popupAvatar.textContent =
            savedUsername.charAt(0).toUpperCase();
    }


    if (popupTotalNotes) {
        popupTotalNotes.textContent =
            notes.length;
    }


    if (popupImportantNotes) {
        popupImportantNotes.textContent =
            notes.filter(note => note.important).length;
    }


    if (popup) {
        popup.classList.add("show");
    }
}


function closeProfilePopup(event) {

    if (
        event &&
        event.target !==
        document.getElementById("profilePopupOverlay")
    ) {
        return;
    }


    const popup =
        document.getElementById("profilePopupOverlay");


    if (popup) {
        popup.classList.remove("show");
    }
}
/* ================= LOGOUT ================= */

function logout() {

    const loginScreen =
        document.getElementById("loginScreen");

    if (loginScreen) {

        loginScreen.style.display = "flex";

    }

    document.getElementById("loginUsername").value = "";
    document.getElementById("loginPassword").value = "";

}
/* ================= SIGN UP ================= */

function showSignup() {

    const loginBox = document.querySelector(".login-box");

    if (!loginBox) return;

    loginBox.innerHTML = `
        <div class="login-logo">📚</div>

        <h1>Create Account</h1>

        <p class="login-subtitle">
            Create your Digital Notes Organiser account.
        </p>

        <form onsubmit="createAccount(event)">

            <div class="login-input-group">
                <label>Username</label>
                <input
                    type="text"
                    id="signupUsername"
                    placeholder="Create username"
                    required
                >
            </div>
<div class="login-input-group">
    <label>Email</label>
    <input
        type="email"
        id="signupEmail"
        placeholder="Enter your email"
        required
    >
</div>
            <div class="login-input-group">
                <label>Password</label>
                <input
                    type="password"
                    id="signupPassword"
                    placeholder="Create password"
                    required
                >
            </div>

            <div class="login-input-group">
                <label>Confirm Password</label>
                <input
                    type="password"
                    id="signupConfirmPassword"
                    placeholder="Confirm password"
                    required
                >
            </div>

            <button type="submit" class="login-btn">
                Create Account
            </button>

        </form>

        <p class="signup-text">
            Already have an account?
            <button type="button" onclick="showLogin()">
                Login
            </button>
        </p>
    `;
}


/* ================= CREATE ACCOUNT ================= */

async function createAccount(event) {

    event.preventDefault();

    const username =
        document.getElementById("signupUsername").value.trim();

    const email =
        document.getElementById("signupEmail").value.trim();

    const password =
        document.getElementById("signupPassword").value;

    const confirmPassword =
        document.getElementById("signupConfirmPassword").value;


    if (password !== confirmPassword) {

        alert("Passwords do not match.");

        return;
    }


    if (username === "" || email === "" || password === "") {

        alert("Please fill all fields.");

        return;
    }


    const { data, error } =
        await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {
                data: {
                    username: username
                }
            }

        });


    if (error) {

        alert(error.message);

        return;
    }


    if (data.user) {

        alert(
            "Account created successfully! Please check your email to confirm your account."
        );

        showLogin();

    }

}


/* ================= SHOW LOGIN ================= */

function showLogin() {

    const loginBox =
        document.querySelector(".login-box");

    if (!loginBox) return;


    loginBox.innerHTML = `
        <div class="login-logo">📚</div>

        <h1>Digital Notes Organiser</h1>

        <p class="login-subtitle">
            Welcome back! Please login to continue.
        </p>

        <form id="loginForm">

            <div class="login-input-group">
                <label>Email</label>

                <input
                    type="email"
                    id="loginUsername"
                    placeholder="Enter your email"
                    required
                >
            </div>

            <div class="login-input-group">
                <label>Password</label>

                <input
                    type="password"
                    id="loginPassword"
                    placeholder="Enter your password"
                    required
                >
            </div>

            <button type="submit" class="login-btn">
                Login
            </button>

        </form>

        <p class="signup-text">
            Don't have an account?
            <button type="button" onclick="showSignup()">
                Sign Up
            </button>
        </p>
    `;


    document
        .getElementById("loginForm")
        .addEventListener("submit", async function(event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("loginUsername")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            const { data, error } =
                await supabaseClient.auth.signInWithPassword({

                    email: email,

                    password: password

                });


            if (error) {

                alert(error.message);

                return;
            }


            const user = data.user;


            const username =
                user.user_metadata?.username ||
                email.split("@")[0];


            document
                .getElementById("loginScreen")
                .style.display = "none";


            showDashboard();

            await loadCloudNotes();


            const profileUsername =
                document.getElementById("profileUsername");

            if (profileUsername) {

                profileUsername.textContent =
                    username;
            }


            const headerUsername =
                document.getElementById("headerUsername");

            if (headerUsername) {

                headerUsername.textContent =
                    username;
            }


            const headerAvatar =
                document.getElementById("headerAvatar");

            if (headerAvatar) {

                headerAvatar.textContent =
                    username
                        .charAt(0)
                        .toUpperCase();
            }

        });
}
/* ================= SUBJECT-WISE NOTES ================= */

