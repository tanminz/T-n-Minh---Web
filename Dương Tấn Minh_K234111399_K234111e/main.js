(function () {
  // Bootstrap the left toolbox Vietlott quick view on initial load
  async function bootQuickVietlott(){
    const box = document.getElementById('toolbox-left');
    if(!box) return;
    async function load(type){
      try{
        const res = await fetch('https://webapi.dantri.com.vn/lottery/get-vietlott-jack');
        const data = await res.json();
        const rows = (data?.Data?.[type]||[]).slice(0,3).map(r=>`<tr><td>${r.DrawDate}</td><td>${r.Result}</td><td>${r.Jackpot}</td></tr>`).join('');
        document.getElementById('lotteryResult').innerHTML = `<table><tr><th>Date</th><th>Result</th><th>Jackpot</th></tr>${rows}</table>`;
      }catch(e){ document.getElementById('lotteryResult').innerHTML = '<p style="color:#b30000;">Không tải được dữ liệu.</p>'; }
    }
    // wire radios in fixed box
    const radios = box.querySelectorAll('input[name=type]');
    radios.forEach(r=> r.addEventListener('change', e=> load(e.target.value)));
    load('mega645');
  }
  const display = document.getElementById('main_display_area');
  const footerSpan = document.getElementById('q10_content');
  const setContent = html => (display.innerHTML = html);

  // Q1–Q2: About Me
  function renderAbout() {
    setContent(`
      <article class="card about-card">
        <h2>About Me</h2>
        <img src="images/z6755515274599_d3fd31a3a84b1d8e869ba9970be025a6.jpg" alt="Avatar" class="avatar">
        <p><b>Họ tên:</b> Dương Tấn Minh</p>
        <p><b>MSSV:</b> K234111399</p>
        <p><b>Lớp:</b> K234111E</p>
        <p><b>Môn học:</b> Business Web Development</p>
      </article>
    `);
  }

  // Q3: Products – load XML
  async function renderProducts() {
    setContent(`<article class="card"><h2>Products</h2><p>Loading...</p></article>`);
    try {
      const res = await fetch('product.xml');
      const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
      const items = xml.querySelectorAll('product');
      const cards = [...items].map(p => `
        <div class="product-card">
          <img src="${p.querySelector('image').textContent}" alt="${p.querySelector('name').textContent}">
          <div class="product-info">
            <h3>${p.querySelector('name').textContent}</h3>
            <p>${p.querySelector('detail').textContent}</p>
          </div>
        </div>`).join('');
      setContent(`<section class="grid">${cards}</section>`);
    } catch (err) {
      setContent(`<p style="color:red;">Lỗi đọc XML: ${err.message}</p>`);
    }
  }

   // Q4: Employees
   function renderEmployees() {
     const html = `
       <section class="employees">
         <h2>Employees</h2>
         <form id="empForm" autocomplete="off">
           <input type="text" id="empId" placeholder="ID" required>
           <input type="text" id="empName" placeholder="Name" required>
           <input type="tel" id="empPhone" placeholder="Phone" required>
           <input type="email" id="empEmail" placeholder="Email" required>
           <input type="number" id="empAge" placeholder="Age" required min="1" max="120">
           <button type="submit" class="btn">Add</button>
         </form>
         <table class="emp-table">
           <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Age</th><th></th></tr></thead>
           <tbody id="empBody"></tbody>
         </table>
       </section>`;
     setContent(html);

     const form = document.getElementById('empForm');
     const tbody = document.getElementById('empBody');
     let employees = JSON.parse(localStorage.getItem('employees_data') || '[]');

     function save() { localStorage.setItem('employees_data', JSON.stringify(employees)); }
     function rowBg(age){ const n=Number(age); return n>=18 && n<=35 ? 'age-young' : 'age-other'; }
     function renderTable(){
       tbody.innerHTML = employees.map((e,i)=>`
         <tr class="${rowBg(e.age)}">
           <td>${e.id}</td>
           <td>${e.name}</td>
           <td>${e.phone}</td>
           <td>${e.email}</td>
           <td>${e.age}</td>
           <td><button class="danger" data-index="${i}">Delete</button></td>
         </tr>`).join('');
     }

     form.addEventListener('submit', (e)=>{
       e.preventDefault();
       const id = document.getElementById('empId').value.trim();
       const name = document.getElementById('empName').value.trim();
       const phone = document.getElementById('empPhone').value.trim();
       const email = document.getElementById('empEmail').value.trim();
       const age = Number(document.getElementById('empAge').value);
       employees.push({id,name,phone,email,age});
       save();
       form.reset();
       renderTable();
     });

     tbody.addEventListener('click', (e)=>{
       const btn = e.target.closest('button[data-index]');
       if(!btn) return;
       const idx = Number(btn.dataset.index);
       if (confirm('Delete employee?')){
         employees.splice(idx,1); save(); renderTable();
       }
     });

     renderTable();
   }

   // Q5: Weather API (dropdown card)
   function renderWeather() {
     const html = `
       <section class="wx">
         <h2 class="wx-title">🌤️ Dự báo thời tiết Việt Nam</h2>
         <div class="wx-select-wrap">
           <select id="wx-select" class="wx-select"></select>
         </div>
         <div id="wx-card" class="wx-card" aria-live="polite"></div>
       </section>`;
     setContent(html);

     const provinces = [
       { id: '2347727', name: 'Hà Nội' },
       { id: '2347728', name: 'TP. Hồ Chí Minh' },
       { id: '20070085', name: 'Đà Nẵng' },
       { id: '2347738', name: 'Khánh Hòa' },
       { id: '2347732', name: 'Cần Thơ' },
       { id: '2347749', name: 'Thừa Thiên Huế' },
       { id: '2347742', name: 'Nghệ An' },
       { id: '2347720', name: 'Đắk Lắk' }
     ];

     const sel = document.getElementById('wx-select');
     provinces.forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.name; sel.appendChild(o); });

     async function fetchWeatherById(id){
       const direct = `https://utils3.cnnd.vn/ajax/weatherinfo/${id}.htm`;
       const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`;
       try{
         const r = await fetch(direct); const j = await r.json();
         if (j?.Data?.success) return j.Data.data.datainfo;
       }catch(_){ }
       const r2 = await fetch(proxy); const j2 = await r2.json();
       if (!j2?.Data?.success) throw new Error('API error');
       return j2.Data.data.datainfo;
     }

     function renderCard(info){
       document.getElementById('wx-card').innerHTML = `
         <div class="wx-panel">
           <h3>${info.location}</h3>
           <img class="wx-icon" src="${info.shadow_icon}" alt="icon"/>
           <p class="wx-status">${info.status}</p>
           <div class="wx-details">
             <p><strong>Nhiệt độ:</strong> ${info.temperature}°C</p>
             <p><strong>Cao nhất:</strong> ${info.high}°C</p>
             <p><strong>Thấp nhất:</strong> ${info.low}°C</p>
             <p><strong>Độ ẩm:</strong> ${info.humidity}</p>
             <p><strong>Gió:</strong> ${info.wind.index} ${info.wind.unit}</p>
             <p><strong>Cảm giác như:</strong> ${info.feels_like}°C</p>
           </div>
         </div>`;
     }

     async function load(){
       document.getElementById('wx-card').innerHTML = '<div class="wx-loading">Loading...</div>';
       try{ const info = await fetchWeatherById(sel.value); renderCard(info);}catch(e){
         document.getElementById('wx-card').innerHTML = '<p style="color:#b30000;">Không tải được dữ liệu.</p>';
       }
     }

     sel.addEventListener('change', load);
     load();
   }

  // Q6: RSS
  async function renderRSS() {
    const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://vnexpress.net/rss/the-thao.rss');
    const res = await fetch(url);
    const data = await res.json();
    const xml = new DOMParser().parseFromString(data.contents, 'text/xml');
    const items = xml.querySelectorAll('item');
    const list = [...items].slice(0, 6).map(i => {
      const title = i.querySelector('title').textContent;
      const link = i.querySelector('link').textContent;
      const desc = i.querySelector('description').textContent;
      const tmp = document.createElement('div');
      tmp.innerHTML = desc;
      const img = tmp.querySelector('img')?.src || '';
      return `<div class="rss-item"><img src="${img}"><a href="${link}" target="_blank">${title}</a></div>`;
    }).join('');
    setContent(`<section><h2>Tin Thể Thao (VnExpress)</h2>${list}</section>`);
  }

  // Q7: Login/Logout
  function renderLogin() {
    const logged = localStorage.getItem('user');
    if (logged) {
      setContent(`<article class="card" style="max-width:520px;margin:auto;text-align:center;">
        <h2>Welcome ${logged}</h2>
        <p>Bạn đã đăng nhập thành công.</p>
        <button class="btn" onclick="logout()">Logout</button>
      </article>`);
    } else {
      setContent(`
        <form id="loginForm" class="card">
          <h2>Login</h2>
          <input id="user" placeholder="User" autocomplete="username">
          <input id="pass" placeholder="Password" type="password" autocomplete="current-password">
          <button class="btn" type="submit">Login</button>
        </form>`);
      const form = document.getElementById('loginForm');
      form.onsubmit = e => {
        e.preventDefault();
        const u = document.getElementById('user').value.trim();
        const p = document.getElementById('pass').value.trim();
        if (u==='admin' && p==='123') { localStorage.setItem('user', u); showContent('login'); }
        else alert('Sai tài khoản!');
      };
    }
  }
  window.logout = () => { localStorage.removeItem('user'); showContent('login'); };

  // Q8: Vietlott API
  async function renderVietlott() {
    const html = `
      <h2>Vietlott Jackpot</h2>
      <div id="lotteryForm">
        <label><input type="radio" name="type" value="mega645" checked> Mega 6/45</label>
        <label><input type="radio" name="type" value="power655"> Power 6/55</label>
      </div>
      <div id="lotteryResult"></div>`;
    setContent(html);
    async function load(type) {
      const res = await fetch('https://webapi.dantri.com.vn/lottery/get-vietlott-jack');
      const data = await res.json();
      const rows = data.Data[type].slice(0, 5).map(r => `
        <tr><td>${r.DrawDate}</td><td>${r.DrawCode}</td><td>${r.Result}</td><td>${r.Jackpot}</td></tr>`).join('');
      document.getElementById('lotteryResult').innerHTML = `<table><tr><th>Date</th><th>Code</th><th>Result</th><th>Jackpot</th></tr>${rows}</table>`;
    }
    load('mega645');
    document.querySelectorAll('input[name=type]').forEach(r => r.onchange = e => load(e.target.value));
  }

  // Q9: Marquee Declaration
  function renderMarquee() {
    setContent(`
      <h2>Declaration</h2>
      <marquee direction="up" scrollamount="3" style="height:120px; border:2px dashed #b30000;">
        I declare that all of these solutions are my own and not copied from anyone in this class.
      </marquee>
    `);
  }

  // Q10: Footer time
  const updateFooter = () => footerSpan.textContent = `Designed by Dương Tấn Minh, today is ${new Date().toLocaleString('vi-VN')}`;
  setInterval(updateFooter, 1000); updateFooter();

  // Menu Router
  window.showContent = function (key) {
    switch (key) {
      case 'about': renderAbout(); break;
      case 'products': renderProducts(); break;
      case 'employees': renderEmployees(); break;
      case 'weather': renderWeather(); break;
      case 'rss': renderRSS(); break;
      case 'login': renderLogin(); break;
      case 'api': renderVietlott(); // =============================
// Q8: AJAX – Vietlott API
// =============================
async function renderVietlott() {
  setContent(`
    <section class="card">
      <h2>🎲 Vietlott Jackpot Result</h2>
      <form id="lotteryForm">
        <label><input type="radio" name="lottoType" value="mega645" checked> Mega 6/45</label>
        <label><input type="radio" name="lottoType" value="power655"> Power 6/55</label>
      </form>
      <div id="lotteryResult" class="table-wrap"><p>Đang tải dữ liệu...</p></div>
    </section>
  `);

  // 🟡 Nếu chạy offline, bạn có thể gắn dữ liệu mẫu trực tiếp như sau:
  const sampleData = {
    "status": true,
    "messageCode": 200,
    "message": "Lấy dữ liệu thành công",
    "data": {
      "mega645": [
        {
          "DrawId": "01425",
          "DrawDate": "29/10/2025",
          "ListNumber": "07-26-35-39-41-42",
          "Jackpot": "17232704500"
        }
      ],
      "power655": [
        {
          "DrawId": "01261",
          "DrawDate": "28/10/2025",
          "ListNumber": "06-08-10-22-25-54|09",
          "Jackpot": "43789084050"
        }
      ]
    }
  };

  // 🟢 Nếu thi thật có Internet, có thể gọi API online:
  // const API_URL = "https://webapi.dantri.com.vn/lottery/get-vietlott-jack";
  // const res = await fetch(API_URL);
  // const sampleData = await res.json();

  // Hàm hiển thị dữ liệu
  function showTable(type) {
    const list = sampleData.data[type];
    if (!list || list.length === 0) {
      document.getElementById("lotteryResult").innerHTML =
        "<p style='color:red;'>Không có dữ liệu.</p>";
      return;
    }

    const rows = list.map(item => `
      <tr>
        <td>${item.DrawDate}</td>
        <td>${item.DrawId}</td>
        <td>${item.ListNumber}</td>
        <td>${Number(item.Jackpot).toLocaleString("vi-VN")} đ</td>
      </tr>
    `).join("");

    document.getElementById("lotteryResult").innerHTML = `
      <table class="emp-table">
        <thead>
          <tr>
            <th>Ngày quay</th>
            <th>Kỳ quay</th>
            <th>Kết quả</th>
            <th>Jackpot</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  // Hiển thị mặc định Mega 6/45
  showTable("mega645");

  // Xử lý khi người dùng chọn loại khác
  document.getElementById("lotteryForm").onchange = e => {
    showTable(e.target.value);
  };
}
;
      case 'formjs': renderMarquee(); break;
      default: renderAbout();
    }
  };
   showContent(display.dataset.default);
   // initialize toolbox
   bootQuickVietlott();
})();
