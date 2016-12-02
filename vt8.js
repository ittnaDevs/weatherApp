// author ittnaDevs
// version 1.0, 26.04.2016
// version 1.1, 27.04.2016 //Taso 1 valmis
// version 1.2, 28.04.2016 //Taso 2 aloittu. Puolet tehty. Chartti puuttuu.KESKEN
// version 1.3, 29.04.2016 //Taso 2 jatkuu. Chartti laitettu. hAxis.ticks pitää laittaa viela, sitten valmis
// version 1.4, 29.04.2016 //Taso 2 jatkuu.
// version 1.5, 29.04.2016 //Taso 2 valmis. Pieni bugi, joka muutti Datessa kuukauden liian suureksi on nyt otettu huomioon
var map;
var geocoder = new google.maps.Geocoder();
var marker;
var point;
var URLA = "/PATH/TO/vt8flask.cgi/";
var kaupungit_url = 'http://appro.mit.jyu.fi/web-sovellukset/vt/vt8/verda.txt';
var valittu = 'Jyväskylä';
var kaupungit = [];
var otsikot = [ 'Ennuste aikavälille','Lämpötila °C','Ilmanpaine hPa',
                'Sateen todennäköinen määrä','Minimi','Maksimi',
                'Tuulennopeus km/h','Tuulen suunta','Tarkoittaa'];
var avainsanat = ['lampo','paine','sade_ksm','sade_min',
                  'sade_max','tuulennopeus','tuulensuunta','symboli'];
var counteri = 0;
var kaupungin_saatiedot = [];
window.onload = function(){
    hae_kaupungit();
    // Jyväskylän koordinaatit
    var latlng = new google.maps.LatLng(62.24, 25.75);
    // asetetaan kartan asetukset ja keskipisteeksi Jyväskylä
    var myOptions = {
        zoom: 13,
        center: latlng,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map"), myOptions);
    google.charts.load('current', {packages: ['corechart', 'line']});
    google.charts.setOnLoadCallback(drawChart);
}

function hae_saatiedot(){
    var osoite = $('#Selecti2').val();
    // var osoite = document.getElementById('Selecti2').value;
    if (osoite.length <= 0) {
        osoite = valittu;
    }
    else {
        valittu = osoite;
    }
    var kaupungin_url = "Kukkuluuruuu";
    // Hakee kaupungin saatiedot
    for (var i = 0; i < kaupungit.length; i++) {
        if (kaupungit[i]['kaupunki'] == osoite) {
            kaupungin_url = kaupungit[i]['osoite'];
            break;
        }
    }
    console.log('hae_saatiedot');
    console.log("valittu: "+ valittu);
    $.ajax({
        async:true,
        type:'GET',
        url:URLA+'hae_saatiedot',
        dataType:'json',
        data:{'osoite':kaupungin_url},
        success:saatiedot_tulos,
        error:error
    });
}

function geokoodaa(){
    console.log("geokoodaa");
    var osoite = document.getElementById('Selecti2').value;
    valittu = osoite;
    console.log("osoite: " + osoite);
    if (osoite.length > 0) {
        geocoder.geocode({'address':osoite}, function(results, status){
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                hae_saatiedot();
            }
        });
    }
}

function hae_kaupungit(){
    // Hakee kaupungit
    console.log('hae_kaupungit');
    $.ajax({
        async:true,
        type:'POST',
        url:URLA+'hae_kaupungit',
        dataType:'json',
        data:{'alustus':kaupungit_url},
        success:kaupungit_tulos,
        error:error
    });
}

function kaupungit_tulos(data, textStatus, request){
    console.log('kaupungit');
    if (data['virhe'] == "") {
        kaupungit = data['otukset'];
        console.log("kaupungit[0]['kaupunki']: " + kaupungit[0]['kaupunki']);
        luo_selecti();
        $('#Selecti2').on('change',geokoodaa);
        if (counteri == 0) {
            geokoodaa();
            counteri++;
        }
    }
    else {
        console.log('virhe: ' +data['virhe']);
    }
}

function luo_selecti(){
    // luo selectin kaupungin tiedoilla
    var div_otus = document.getElementById('Selecti_div');
    var select = document.createElement('select');
    select.setAttribute('id',"Selecti2");
    select.setAttribute('name','Selecti2');
    tmp = [];
    for (var i = 0; i < kaupungit.length; i++) {
        tmp[i] = (kaupungit[i]['kaupunki']);
    }
    tmp.sort();
    // kaupungit_sorted = tmp;
    valittu = tmp[0];
    console.log("valittu: " + valittu);
    for (var i = 0; i < tmp.length; i++) {
        var option = document.createElement('option');
        option.setAttribute('value',tmp[i]);
        var txt = document.createTextNode(tmp[i]);
        option.appendChild(txt);
        select.appendChild(option);
    }
    $('#Selecti_div').replaceWith(select);
}

function saatiedot_tulos(data, textStatus, request){
    // Haetut saatiedot kasitellaan taalla JA luodaan javascriptilla kyseinen dokumentti
    if (data['virhe'].length <= 0) {
        console.log('saatiedot');
        var tiedot = data['otukset'];
        kaupungin_saatiedot = tiedot;
        console.log(tiedot);
        var div_otus = document.getElementById('Saatiedot');
        var taulukko = document.createElement('table');
        taulukko.setAttribute('id',"Saatiedot");
        taulukko.setAttribute('name','Saatiedot');
        var tbody1=document.createElement('tbody');
        taulukko.appendChild(tbody1);
        //1. rivi
        var tr1 = document.createElement('tr');
        tbody1.appendChild(tr1);
        var td1 = document.createElement('td');
        var a = document.createElement('a');
        a.setAttribute('href',data['linkki']);
        var txt = document.createTextNode(data['teksti']);
        a.appendChild(txt);
        td1.appendChild(a);
        tr1.appendChild(td1);
        var td2 = document.createElement('td');
        var h21 = document.createElement('h2');
        var txt2 = document.createTextNode('Viimeksi päivitetty '+data['update']);
        h21.appendChild(txt2);
        td2.appendChild(h21);
        tr1.appendChild(td2);
        var td22 = document.createElement('td');
        var h22 = document.createElement('h2');
        var txt22 = document.createTextNode('Aurinko nousee '+data['rise']);
        h22.appendChild(txt22);
        td22.appendChild(h22);
        tr1.appendChild(td22);
        var td23 = document.createElement('td');
        var h23 = document.createElement('h2');
        var txt23 = document.createTextNode('Aurinko laskee '+data['sets']);
        h23.appendChild(txt23);
        td23.appendChild(h23);
        tr1.appendChild(td23);

        //otsikoiden rivi ja columnit ts. 2.rivi
        var tr2 = document.createElement('tr');
        for (var i = 0; i < otsikot.length; i++) {
            var td3 = document.createElement('td');
            var h31 = document.createElement('h3');
            var txt3 = document.createTextNode(otsikot[i]);
            h31.appendChild(txt3);
            td3.appendChild(h31);
            tr2.appendChild(td3);
        }
        tbody1.appendChild(tr2);

        //varsinaiset saatiedot alkavat tasta
        for (var i = 0; i < tiedot.length; i++) {
            var tr3 = document.createElement('tr');
            var tdtime = document.createElement('td');
            var txttime = document.createTextNode(tiedot[i]['time'] +' - '+ tiedot[i]['time2']);
            tdtime.appendChild(txttime);
            tr3.appendChild(tdtime);
            for (var j = 0; j < avainsanat.length; j++) {
                var td4 = document.createElement('td');
                var txt4 = document.createTextNode(tiedot[i][avainsanat[j]]);
                td4.appendChild(txt4);
                tr3.appendChild(td4);
            }
            tbody1.appendChild(tr3);
        }
        $('#Saatiedot').replaceWith(taulukko);
        drawChart();
    }
    else {
        console.log(data['virhe']);
    }
}

function drawChart() {
    if (kaupungin_saatiedot.length > 0) {
        var taulukko = [];
        var _date = [];
        taulukko.push(['aika','lämpötila']);
        console.log(kaupungin_saatiedot[0]['kk']);
        for (var i = 0; i < kaupungin_saatiedot.length; i++) {
            tmp = [];
            //luodaan date-otus, joka kelpaa chartille
            tmp[0] = new Date(parseInt(kaupungin_saatiedot[i]['vuosi']), parseInt(kaupungin_saatiedot[i]['kk'])-1,
            parseInt(kaupungin_saatiedot[i]['pp']), parseInt(kaupungin_saatiedot[i]['h']),
            parseInt(kaupungin_saatiedot[i]['m']), parseInt(kaupungin_saatiedot[i]['s']));
            tmp[1] = parseFloat(kaupungin_saatiedot[i]['lampo']);
            taulukko.push(tmp);
        }

        var data = google.visualization.arrayToDataTable(taulukko);

          var options = {
            title:'Lämpötilaennuste ajalle '+ kaupungin_saatiedot[0]['time'] + ' - ' + kaupungin_saatiedot[kaupungin_saatiedot.length - 1]['time'],
            // subtitle: "6 tunnin välein ilmoitettuna",
            // hAxis:{ticks:_date},
            legend: { position: 'right' },
            hAxis: {title: 'Päivämäärä'},
            vAxis: {title: 'Lämpötila (°C)'}
          };

          var chart = new google.visualization.LineChart(document.getElementById('chart'));

          chart.draw(data, options);
        }
    }

function error(xhr, status, error) {
        console.log( "Error: " + error );
        console.log( "Status: " + status );
        console.log( xhr );
}
