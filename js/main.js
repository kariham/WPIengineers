const questionsData = {
    engineers: {
        title: "WPI Engineers (Injecties op Terminal)",
        questions: [
            "Wordt de juiste ADR-documentatie en signalisatie op het voertuig toegepast?",
            "Zijn de specifieke PBM's voor injectieprocedures aanwezig en in goede staat (chemische handschoenen, gelaatsscherm)?",
            "Is de noodstop en de spill-kit op de terminal direct bereikbaar en operationeel?",
            "Wordt de slangkoppeling gecontroleerd op lekkages vóór de start van de injectie?"
        ]
    },
    seveso: {
        title: "WPI Magazijn Seveso (Gevaarlijke Goederen)",
        questions: [
            "Zijn chemicaliën correct gesegregeerd op basis van hun gevarenklasse (incompatibele stoffen gescheiden)?",
            "Zijn de opvangbakken (retentielakken) leeg, schoon en hebben ze voldoende capaciteit?",
            "Zijn de SDS-veiligheidsinformatiebladen direct digitaal of fysiek raadpleegbaar?",
            "Is de signalisatie van de Seveso-zones en gevarenpictogrammen duidelijk zichtbaar en onbeschadigd?"
        ]
    },
    brand: {
        title: "WPI Gebouwbeheer & Brandveiligheid",
        questions: [
            "Zijn alle nooduitgangen en vluchtwegen volledig vrij van obstakels?",
            "Zijn de brandblussers en haspels gekeurd (binnen het jaar) en direct toegankelijk?",
            "Is de algemene orde en netheid op het terrein en in de gangen conform?",
            "Werkt de noodverlichting naar behoren (visuele controle testknop indien mogelijk)?"
        ]
    }
};

let currentType = '';

function showInspection(type) {
    currentType = type;
    document.getElementById('inspection-selector').classList.add('hidden');
    const form = document.getElementById('wpi-form');
    form.classList.remove('hidden');
    
    const container = document.getElementById('form-questions');
    container.innerHTML = `<h3>${questionsData[type].title}</h3>`;
    
    questionsData[type].questions.forEach((q, index) => {
        container.innerHTML += `
            <div class="question-block">
                <p><strong>${index + 1}. ${q}</strong></p>
                <div class="radio-group">
                    <label><input type="radio" name="q_${index}" value="Conform" required> C</label>
                    <label><input type="radio" name="q_${index}" value="Niet Conform"> NC</label>
                    <label><input type="radio" name="q_${index}" value="Nvt"> NVT</label>
                </div>
                <input type="text" name="comment_${index}" placeholder="Opmerkingen / Actiehouder">
            </div>
        `;
    });
}

function resetForm() {
    document.getElementById('wpi-form').classList.add('hidden');
    document.getElementById('inspection-selector').classList.remove('hidden');
    document.getElementById('wpi-form').reset();
}

document.getElementById('wpi-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Genereren van een print-vriendelijk element voor de PDF
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial, sans-serif';
    
    const inspector = document.getElementById('inspector_name').value;
    const date = document.getElementById('inspection_date').value;
    const location = document.getElementById('inspection_location').value;
    
    element.innerHTML = `
        <h1>Rapport: ${questionsData[currentType].title}</h1>
        <p><strong>Inspector:</strong> ${inspector}</p>
        <p><strong>Datum:</strong> ${date}</p>
        <p><strong>Locatie:</strong> ${location}</p>
        <hr>
        <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse; margin-top:20px;">
            <tr style="background-color: #f2f2f2;">
                <th>Vraag</th>
                <th>Status</th>
                <th>Opmerkingen</th>
            </tr>
    `;
    
    questionsData[currentType].questions.forEach((q, index) => {
        const status = document.querySelector(`input[name="q_${index}"]:checked`).value;
        const comment = document.querySelector(`name="comment_${index}"`).value || '-';
        element.innerHTML += `
            <tr>
                <td>${q}</td>
                <td><strong>${status}</strong></td>
                <td>${comment}</td>
            </tr>
        `;
    });
    
    element.innerHTML += `</table>`;
    
    const opt = {
        margin:       10,
        filename:     `WPI_${currentType}_${date}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
});
