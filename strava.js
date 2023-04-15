const clientId = '98135';
const clientSecret = '250fb83eda23244fd4a165a4a8565f398a5e1e56';
var code;
var activities = [];
var userData
var data
var accessToken
var startDate = 0;
var endDate = (Date.now() / 1000 );
var displayAmount
var opacity = 1;
var mapColor = "#005694"

const polylines = [];

window.addEventListener("load", (event) => {
  getAuthorizationCodeFromUrl() 
  if (code) {
    console.log('Code Found on Load') 
    getAccessToken(code)
  } else {
    console.log('Code Not Present on Load') 
  }
});

// Redirect the user to the Strava authorization page
function redirectToStravaAuth() {
  console.log('Starting Auth Sequence')
  const redirectUri = 'https://levtus.github.io/stravatrace';
  const responseType = 'code';
  const scope = 'read,activity:read';
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;
  window.location.href = authUrl;
}

// Get the authorization code from the URL
function getAuthorizationCodeFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    code = urlParams.get('code');
    if (code) {
        console.log(code)
        return code
    }
}

// Exchange the authorization code for an access token
async function getAccessToken(code) {
  const tokenUrl = 'https://www.strava.com/oauth/token';
  if (!data || !data.access_token) {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code', 
      }),
    });
    data = await response.json(); 
    console.log("Access Token = " + data.access_token)
  } else {
    console.log("Access Token Already Ready") 
  }
  accessToken = data.access_token;
  return accessToken;
}

async function getActivities() {
    const displayCount = parseInt(document.getElementById("displayCount").value);
    const pageCount = Math.ceil(displayCount / 100);
    for (let i = 0; i < pageCount ; i++) {
        const page = i + 1
        console.log(`Getting Page ${page}`)
        const activitiesLink = `https://www.strava.com/api/v3/athlete/activities?access_token=${accessToken}&per_page=100&page=${page}`;
        const response = await fetch(activitiesLink);
        const activityData = await response.json();
        activities = activities.concat(activityData);
    }
    console.log(activities);
}

function getAllRidesData() {
    const mapStyle = document.getElementById('mapStyle').selectedOptions[0].value;
    const activityType = document.getElementById('activityType').selectedOptions[0].value;
    const activityPurpose = document.getElementById('activityPurpose').selectedOptions[0].value;
    if (mapStyle == "Heatmap") { opacity = 0.3; } else { opacity = 1; }
    console.log(`Opacity set to ${opacity}`)
    
    for (let i = 0; i < activities.length; i++) {
        const coordinates = L.Polyline.fromEncoded(activities[i].map.summary_polyline).getLatLngs();
        
        const distance = (Math.round(activities[i].distance / 100) / 10);
        const typeName = activities[i].sport_type.replace(/([a-z])([A-Z])/g, '$1 $2');
        const formattedDate = formatDate(activities[i].start_date_local);
        const elapsedTime = formatTime(activities[i].elapsed_time);
        const movingTime = formatTime(activities[i].moving_time);
        const activityName = activities[i].name;
        console.log(activityName)
        L.polyline(
            coordinates,
            {
                color: mapColor,
                weight: 4,
                opacity: opacity,
                lineJoin:'round'
            }
        ).bindPopup(activityName + " (" + typeName + ")\n" + formattedDate + "\n\nDistance: " + distance + "km\n" + "Elapsed Time: " + elapsedTime  + "\nMoving Time: " + movingTime + `\n<a href=\"https://www.strava.com/activities/${activities[i].id}\">Open Link</a>`).addTo(traces)
        document.getElementById("firstCollumn").innerHTML = document.getElementById("firstCollumn").innerHTML + `<o onclick="traces[${i}].openPopup()">${activities.length - i}</o><br>`
        document.getElementById("secondCollumn").innerHTML = document.getElementById("secondCollumn").innerHTML + `<a onclick="traces[${i}].openPopup()">${activityName}</a><br>`
    };
    traces.addTo(map)
}            

function formatDate(notFormatted) {
    const date = new Date(notFormatted);
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });
}
function formatTime(seconds) {
    const time = new Date(seconds);
    time.setSeconds(time);
    return time.toISOString().substr(11, 8)
}