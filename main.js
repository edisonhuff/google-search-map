function initMap(setSelectedPlace) {
  // DOM Element and sidebar state constants;
  var $map       = document.getElementById('map'),
      $searchbar = document.getElementById('searchbar'),
      $sidebar   = document.getElementById('sidebar'),
      $detail    = document.getElementById('detail');
      
  var $toggleDetail  = document.getElementById('detail-toggle');
      $toggleSidebar = document.getElementById('sidebar-toggle');

  var details  = {};
      sidebar  = {
        placeList: [],
      },
      zenefits = {
        lat: 37.785112,
        lng: -122.395584,
        content: '<div><strong>Zenefits</strong><br>North Tower, 303 2nd St #401, San Francisco',
      };

  // Init methods requiring a DOM element
  var map = new google.maps.Map(
    $map,
    {
      center: zenefits,
      mapTypeControl: false,
      zoom: 14,
    }
  );
  var searchBox   = new google.maps.places.SearchBox($searchbar);
  var autocomplete = new google.maps.places.Autocomplete($searchbar);
  
  // Dependent Init Methods
  var placesService = new google.maps.places.PlacesService(map);
  var marker = new google.maps.Marker({ position: zenefits, map: map }); 
  var infowindow = new google.maps.InfoWindow();
  
  // Marker Setup and Initial InfoWindow
  var markers  = [];
  markers.push(marker);  

  infowindow.setContent(zenefits.content);
  infowindow.open(map, marker);
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(zenefits.content);
    infowindow.open(map, this);
  });

  // Marker Helper functions
  function createMarker(place) {
    var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location
    });

    markers.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(place.name);
      infowindow.open(map, this);
    });
  }
  
  function removeAllMarkers() {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
    markers = [];
  }

  function pluckAddress(place) {
    if (place.formatted_address) {
        return place.formatted_address;
    } else if (place.address_components) {
      return [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(' ');
    }
    return '';
  }

  // Sidebar List Item
  function listItem(place) {
    var item = document.createElement('li'),
        header = document.createElement('h4')
        headerText = document.createTextNode(place.name)
        address = document.createTextNode(
          pluckAddress(place)
        );
    header.appendChild(headerText);
    item.appendChild(header);
    item.appendChild(address);

    // adjusts view to focus on item or centers map on item
    item.addEventListener('click', function() {
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
      }
      $detail.className = "open";
      $toggleDetail.className = "show";
      updateDetails(place);
    });

    // bounces marker when hovered in list view
    item.addEventListener('mouseover', function() {
      place.marker.setAnimation(google.maps.Animation.BOUNCE);
    });

    item.addEventListener('mouseleave', function() {
      place.marker.setAnimation(google.maps.Animation.NONE);
    });

    return item;
  }

  // constructs the details page
  // watch out this one is a doozy
  function detailsDiv(place) {
    var details   = document.createElement('div');
    details.id    = 'detail-content';
    
    var title      = document.createElement('div'),
        header     = document.createElement('h4'),
        name       = document.createTextNode(place.name),
        addressEle = document.createElement('p'),
        address    = document.createTextNode(pluckAddress(place)),

        contact    = document.createElement('div'),
        
        phoneEle   = document.createElement('p'),
        phoneLabel = document.createTextNode('phone: '),
        phoneLink  = document.createElement('a'),
        phoneText  = document.createTextNode(place.formatted_phone_number),
        
        webEle     = document.createElement('p'),
        webLabel   = document.createTextNode('website: '),
        webLink    = document.createElement('a'),
        webText    = document.createTextNode(place.website),
        
        reviewEle  = document.createElement('h4');
        reviewText = document.createTextNode('Reviews')
        
        reviews    = document.createElement('div');

    // Title
    title.className='title';

    header.appendChild(name);
    addressEle.appendChild(address);
    title.appendChild(header);
    title.appendChild(addressEle);

    // Contact info
    contact.className = 'contact';

    phoneLink.href = 'tel: ' + place.international_phone_number;
    phoneLink.appendChild(phoneText);
    phoneEle.appendChild(phoneLabel);
    phoneEle.appendChild(phoneLink);
    contact.appendChild(phoneEle);

    webLink.href = place.website;
    webLink.appendChild(webText);
    webEle.appendChild(webLabel);
    webEle.appendChild(webLink);
    contact.appendChild(webEle);

    // Reviews Title
    reviewEle.appendChild(reviewText);

    // Reviews
    reviews.className = 'reviews';
    reviews.appendChild(reviewEle);
    place.reviews && place.reviews.forEach(function(review) {
      var container = document.createElement('div'),
          nameEle   = document.createElement('p'),
          name      = document.createTextNode(review.author_name),
          picLink   = document.createElement('a'),
          picture   = document.createElement('img'),
          timeEle   = document.createElement('p'),
          time      = document.createTextNode(review.relative_time_description),
          ratingEle = document.createElement('p'),
          rating    = document.createTextNode(review.rating + '/5'),
          textEle   = document.createElement('p'),
          text      = document.createTextNode(review.text);

      // set attributes
      picLink.href = review.author_url;
      picture.src  = 'http://' + review.profile_photo_url;
      picture.align  = 'middle';
      textEle.className = 'review-text';

      // nest children
      nameEle.appendChild(name);
      picLink.appendChild(picture);
      timeEle.appendChild(time);
      ratingEle.appendChild(rating);
      textEle.appendChild(text);

      // add everything together
      container.appendChild(picLink);
      container.appendChild(nameEle);
      container.appendChild(timeEle);
      container.appendChild(ratingEle);
      container.appendChild(textEle);
      reviews.appendChild(container);
    })

    details.appendChild(title);
    details.appendChild(contact);
    place.reviews && details.appendChild(reviews);

    return details;
  }

  function updateDetails(place) {
    var oldDetails = document.getElementById('detail-content');
    $detail.removeChild(oldDetails);
    
    if (details[place.place_id]) {
      $detail.appendChild(detailsDiv(details[place.place_id]));
      return;
    }

    placesService.getDetails(
      { placeId: place.place_id },
      function(placeDetails, status) {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          var div = document.createElement('div')
          var err = document.createTextNode(status);
          div.id = 'detail-content';
          div.appendChild(err);
          $detail.appendChild(div);
          return;
        }

        details[place.place_id] = placeDetails;
        $detail.appendChild(detailsDiv(placeDetails));
      }
    );
  }

  // Handles DOM updates for the Sidebar
  sidebar.update = function() {
    var oldList = document.getElementById('list')
    var list = document.createElement('ul');

    $sidebar.removeChild(oldList);
    list.id = 'list';

    this.placeList.forEach(function(place) {
      list.appendChild(listItem(place))
    })

    $sidebar.appendChild(list);
  }

  // Ensures that bounds are appropriate for the search
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  // Handles search updates
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }

    removeAllMarkers()
    sidebar.placeList = [];

    var bounds = new google.maps.LatLngBounds();

    places.forEach(function(place) {
      // if the place has no coordinates we can't update bounds
      if (!place.geometry) {
        return;
      }

      // add new place to markers
      var marker = new google.maps.Marker({
        map: map,
        title: place.name,
        position: place.geometry.location
      });

      var infowindow = new google.maps.InfoWindow();
      google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent('<h4>' + place.name + '</h4>' + pluckAddress(place));
        infowindow.open(map, this);
      });

      // add to tracking arrays
      place.marker = marker;
      sidebar.placeList.push(place);
      markers.push(marker);

      // update bounds to include new place
      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });

    map.fitBounds(bounds);
    sidebar.update();
    $sidebar.className="open";
    $toggleSidebar.className="show";
  });

  // Autocomplete Setup
  autocomplete.bindTo('bounds', map);
  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();
    // Places search queries trigger place_changed
    if (!place.geometry) {
      return;
    }
    
    var marker = new google.maps.Marker({
      location: place.geometry.location,
      map: map,
    })

    infowindow.close();
    removeAllMarkers();
    place.marker = marker;
    sidebar.placeList = [place];
    markers.push(marker);

    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
    }

    marker.setPosition(place.geometry.location);
    marker.setAnimation(google.maps.Animation.DROP);
    marker.setVisible(true);

    var address = pluckAddress(place);

    infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
    infowindow.open(map, marker);
    $toggleSidebar.className = '',
    $sidebar.className = '';
    sidebar.update()

  });

  // handles opening and closing the sidebar/searchbar
  $toggleSidebar.addEventListener('click', function() {
    if ($searchbar.className === 'open') {
      $searchbar.className = '';
      $sidebar.className = '';
      $detail.className = '';
      $toggleDetail.className = '';
      return;
    }
    $searchbar.className = 'open';
    $sidebar.className = 'open';
  });

  // handles closing the Detail pane
  $toggleDetail.addEventListener('click', function() {
    $detail.className = '';
    $toggleDetail.className = '';
  });
}