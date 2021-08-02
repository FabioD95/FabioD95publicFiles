import { setStatusBarNetworkActivityIndicatorVisible, StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Image, Modal, Button, Platform, TouchableOpacity } from 'react-native';
import {useDispatch, useSelector} from 'react-redux'
import { setLatitude, setLongitude } from '../../store/actions'
import MapView, { Marker, Callout, Geojson, Polygon, PROVIDER_GOOGLE, LocalTile, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import Carousel from 'react-native-snap-carousel';
import { MaterialIcons, Feather, Ionicons, Entypo } from '@expo/vector-icons';
import {circles} from '../../risorse/circles'
import {point} from '../../risorse/luoghi'
import HeaderNavigation from '../../components/HeaderNavigation'
import {zone} from '../../risorse/areaProtettaCoords/zone'
import trillRedZone from '../../risorse/trillRedZone'
import {setMarkerDescriptionModal, setInfoMapModal, setCarouselPage, setAccessLevel} from '../../store/actions'
import InfoMapModal from './components/infoMapModal'
import {tr, initTr} from '../../lenguages/translation';    //  initTr()    //  {tr('')}
import InfoAreaProtetta from './components/infoAreaProtetta'
import InfoSeaRules from './components/infoSeaRules'
import ModalDescription from './components/modalDescription';
import UnlockMap from './components/UnlockMap';


export default function Maps() {
  initTr()

  const dispatch = useDispatch()
  function setModal() {dispatch(setMarkerDescriptionModal(true))}
  const {markerDescriptionModal} = useSelector((state) => state.reducer)
  const {accessLevel} = useSelector((state) => state.reducer)

  //------------------------------------------------------------trill alert---------------------------------------------
  let trillState = false
  if(trillRedZone() == true) {
    trillState = true
  } else {
    trillState = false
  }

  useEffect(() => {
    if(trillState == true) alert('attenzione zona vietata')
  }, [trillState])
  //---------------------------------------------end trill alert-----------------------------------------------------

  //------------------------------------------------------------initial view on map-------------------------------------------------------------------------
  const [ onRegion, setOnRegion ] = useState(
    region={
      latitude: 39.180736,
      longitude: 9.569540,
      latitudeDelta: 0.15,
      longitudeDelta: 0.04,
    }
  )
  //------------------end initial view-----------------------------------------------------------------------------------------------------------------------

  //----------------------------------------------------------------request and find position-------------------------------------------------------------
  const [location, setLocation] = useState(
    {coords:{
      accuracy: 15.222000122070312,
      altitude: 270.2088453953831,
      altitudeAccuracy: 3,
      heading: 1.7572250366211,
      latitude: 39.180736,
      longitude: 9.569540,
      speed: 0.10053517669439316,
    },
    mocked: false,
    timestamp: 1621247077546,}
  );
  const [errorMsg, setErrorMsg] = useState(null);
  const [ askLocation, setAskLocation ] = useState(true)
  //console.log('askLocation: ', askLocation)
  
    const [ myInterval, setMyInterval ] = useState(false)

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android' && !Constants.isDevice) {
        setErrorMsg(
          'Oops, this will not work on Snack in an Android emulator. Try it on your device!'
        );
        return;
      }
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      dispatch(setLatitude(location.coords.latitude)),
      dispatch(setLongitude(location.coords.longitude))
    })();

    //setInterval(() => {setMyInterval(!myInterval)}, 2000)
  }, [askLocation]);   // , [myInterval]

  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = JSON.stringify(location);
  }
  //console.log('myPosition: ', text )

    let initialPosition = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.15,
      longitudeDelta: 0.04,
    }
    // useEffect(() => {
    //   setOnRegion(initialPosition)
    // }, [location])

    //console.log(onRegion.latitude)

    //console.log('onregion: ', initialPosition)
  //-----end find position--------------------------------------------------------------------------------------------------------------------------------  

  const [ page, setPage ] = useState(0)    //----------------------state to ste whitch page show on modal----------------------------------------------------

  //-----------------------------------------------------------------manage carousel----------------------------------------------------------------------
  onCarouselItemChange = (index) => {
    let myLocation = point[index]
    //console.log('item index: ', index)
    setPage(index)
    dispatch(setCarouselPage(index))

    _map.animateToRegion({
      latitude: myLocation.latitude,
      longitude: myLocation.longitude,
      latitudeDelta: 0.03,    //  più è alto il numero e minore sarà il livello di ingrandimento
      longitudeDelta: 0.03,   //  0.04
    })
  }

  renderCarouselItem = ({item, index}) => {
    return (
      <TouchableOpacity onPress={ () => {setModal()} }> 
        <View style={styles.cardContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle}>{tr(item.title)}</Text>
            </View>
          <Image style={styles.cardImage} source={item.imageIntro} />
        </View>
      </TouchableOpacity>
    )
  }
  //---------end carousel----------------------------------------------------------------------------------------------------------------------------
  
  //console.log('page: ', page)
  //console.log('array: ', point[page].description)
  //console.log(onRegion)

  //------------------------------------------center to me----------------------------------------------------
  centerToMe = () => {
    _map.animateToRegion({
      latitude: initialPosition.latitude,
      longitude: initialPosition.longitude,
      latitudeDelta: 0.10,
      longitudeDelta: 0.04,
    })
  }
  //----------------------------end center to me-----------------------------------------------------------------------------

  //---------------------------------------------------switch map------------------------------------------------------
  const [ mapStyle, setMapstyle ] = useState(true)
  const styleMap = mapStyle ? 'satellite' : 'standard'
  //--------------------------------------end switch---------------------------------------------------------------------

  //-------------------------------------------------trigger zoom----------------------------------
  const [ niente, setNiente ] = useState(true)    // trigeer touch screen
  const [ niente2, setNiente2 ] = useState(true)    //for carousel
  const [ zoom, setZoom ] = useState(15)
  const [ altitude, setAltitude ] = useState(15)

  useEffect(() => {
    let onLocationPress = async () => {
      if (_map) {
        try {
          const camera = await _map.getCamera()
          //console.log('camera: ', camera.heading)
          //console.log('zoom: ', camera.zoom)
          //console.log('altitude: ', Math.abs(camera.altitude))
          setZoom(Math.abs(camera.zoom))    //Math.abs(Math.floor(camera.zoom))
          setAltitude(Math.abs(camera.altitude))
          setNiente2(false)
        } catch (err) {
          //console.error(err)
        }
      }
    }
    onLocationPress()
  }, [niente])

  useEffect(() => { setNiente2(true) }, [page])

  //console.log('zoom: ', zoom)
  //console.log('niente: ', niente)
  //console.log('niente2: ', niente2)

  //----------------------------------------end zoom--------------------------------------------------------------
  
  //const pointArray = zoom > 14 || niente2 == true ? point : mainPoint    //  il livello di zoom determina quando appaiono i marker secondari, più è alto e più si dovrà ingrandire per vederli
  //console.log('zoom: ', zoom)

  const showMainPoint = zoom > 13.8 || altitude < 9300 || niente2 == true ? false : true    //  il livello di zoom determina quando appaiono i marker secondari, più è alto e più si dovrà ingrandire per vederli, per l' altitude al contrario
  // point.forEach(function(item, index) {
  //   console.log(item.title)
  // })

  //-----------------------------------------------------------------------------set camera------------------------------------------------------
  const [ followNavigation, setFollowNavigation ] = useState(false)
  //console.log('followNavigation: ', followNavigation)

  useEffect(() => {
    if (followNavigation == true) _map.animateCamera({heading: location.coords.heading})
    if (Platform.OS == 'android' && followNavigation == true) _map.animateCamera({center: initialPosition, heading: location.coords.heading})
  }, [askLocation])

  return (
    <View style={styles.container} onTouchEnd={() => {setNiente(!niente)}} >

      <MapView style={styles.map} 
        initialRegion={onRegion}
        //provider={PROVIDER_GOOGLE}    //  mi ammazza le prestazioni su ios e lagga male 
        ref={map => _map = map}
        mapType={styleMap}
        showsUserLocation={true}
        //region={ followAndroid }  //  abilitate to follow real position on screen
        followsUserLocation={followNavigation}    //   solo per ios
        showsMyLocationButton={false}
        onUserLocationChange={() => {setAskLocation(!askLocation)}}
      > 

        { 
          point.map(({title, latitude, longitude, image, main}, index) => {
            return(
              Platform.OS == 'ios' ? (showMainPoint == true ? (main == true ?
              <MapView.Marker
                key={index}
                //title={title}
                coordinate={{latitude: latitude, longitude: longitude}}
                //image={image}
                onPress={() => { _carousel.snapToItem(index) }}  
                tracksViewChanges={false}   
              >
                <Image source={image} style={{width: iconSizeWidth, height: iconSizeHeight, marginBottom: Platform.OS == 'ios' ? iconSizeHeight : 0, borderWidth: 0, borderColor: 'white' }}/>
              </MapView.Marker> : null) :

              <MapView.Marker
                key={index}
                //title={title}
                coordinate={{latitude: latitude, longitude: longitude}}
                //image={image}
                onPress={() => { _carousel.snapToItem(index) }} 
                tracksViewChanges={false}
              >
                <Image source={image} style={{width: iconSizeWidth, height: iconSizeHeight, marginBottom: Platform.OS == 'ios' ? iconSizeHeight : 0, borderWidth: 0, borderColor: 'white' }}/> 
              </MapView.Marker>) 
                : 
              (showMainPoint == true ? (main == true ?
                <MapView.Marker
                  key={index}
                  //title={title}
                  coordinate={{latitude: latitude, longitude: longitude}}
                  image={image}
                  onPress={() => { _carousel.snapToItem(index) }}  
                  tracksViewChanges={false}   
                >
                  {/* <Image source={image} style={{width: iconSizeWidth, height: iconSizeHeight, marginBottom: Platform.OS == 'ios' ? iconSizeHeight : 0, borderWidth: 0, borderColor: 'white' }}/> */}
                </MapView.Marker> : null) :

                <MapView.Marker
                  key={index}
                  //title={title}
                  coordinate={{latitude: latitude, longitude: longitude}}
                  image={image}
                  onPress={() => { _carousel.snapToItem(index) }} 
                  tracksViewChanges={false}
                >
                  {/* <Image source={image} style={{width: iconSizeWidth, height: iconSizeHeight, marginBottom: Platform.OS == 'ios' ? iconSizeHeight : 0, borderWidth: 0, borderColor: 'white' }}/>  */}
                </MapView.Marker>)
            )
          }) 
        } 


        {
          zone.map(({title, color, coord}, index) => {
            return(
              <Polygon 
                key={index}
                coordinates={coord}
                strokeColor={color}
                fillColor={'rgba(0,0,0,0.1)'}
              />
            )
          })
        }


        {
          circles.map(({center, radius, strokeColor, fillColor}, index) => {
            return(
              <Circle
                key={index}
                center={center}
                radius={radius}
                strokeColor={strokeColor}
                fillColor={fillColor}
              />
            )
          })
        }
        
      </MapView>


      <View style={{ right: 10, position: 'absolute', top: 35, alignItems: 'center'}}>
        {/* <Text style={{color: 'white'}}>coord: lat: {location.coords.latitude}, long: {location.coords.longitude}</Text> */}
        <TouchableOpacity onPress={()=>{setAskLocation(!askLocation); centerToMe()}} style={{marginTop: 10}}>
          <MaterialIcons name="gps-fixed" size={40} color={mapStyle == false ? "rgba(100,100,100,0.7)" : "rgba(200,200,200,0.7)"} />
        </TouchableOpacity>  

        <TouchableOpacity onPress={() => {setFollowNavigation(!followNavigation)}} style={{marginTop: 10}} >
          <Ionicons name="navigate-circle" size={40} color={followNavigation == true ? 'orange' : (mapStyle == false ? "rgba(100,100,100,0.7)" : "rgba(200,200,200,0.7)")} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {setMapstyle(!mapStyle)}} style={{marginTop: 10}} >
          <Feather name="map" size={34} color={mapStyle == false ? "rgba(100,100,100,0.7)" : "rgba(200,200,200,0.7)"} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {dispatch(setInfoMapModal(true))}} style={{marginTop: 10}} >
          <Entypo name="info-with-circle" size={35} color={mapStyle == false ? "rgba(100,100,100,0.7)" : "rgba(200,200,200,0.7)"} />
        </TouchableOpacity>
      </View>

      <ModalDescription />
      <InfoMapModal />
      <InfoAreaProtetta />
      <InfoSeaRules />
      <UnlockMap />
      
      <View style={{}} >
        <HeaderNavigation />
      </View>
      

      <Carousel
        ref={(c) => { _carousel = c; }}
        data={point}
        containerCustomStyle={styles.carousel}
        renderItem={renderCarouselItem}
        sliderWidth={Dimensions.get('window').width}
        itemWidth={300}
        onSnapToItem={(index) => onCarouselItemChange(index)}
        loop={true}
        //removeClippedSubviews={true}
      />


    </View>
  );
}

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const iconSizeHeight = Platform.OS == 'ios' ? 60 : 60
const iconSizeWidth = iconSizeHeight * 0.71875
//const iconSizeWidth = Platform.OS == 'ios' ? windowWidth * 0.1 : windowWidth * 0.12
//const iconSizeWidth = 115
//const iconSizeHeight = iconSizeWidth * 1.39
//const iconSizeHeight = 160
const border = 0

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: border,
    borderColor: 'orange',
    justifyContent: 'flex-end',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    //...(Platform.OS !== 'android' && {zIndex: 60})
    // borderWidth: border,
    // borderColor: 'green',
  },
  modal: {
    backgroundColor: 'rgba(255,255,255,0.95)', //
    marginTop: Platform.OS == 'ios' ? 40 : 10,
    marginBottom: 10,
    marginHorizontal: 15,
    padding: 10,
    borderRadius: 10, 
    alignItems: 'center', 
    flex: 1
  },
  carousel: {
    position: 'absolute',
    bottom: 0,
    marginBottom: Platform.OS == 'ios' ? 70 : 60,
    borderWidth: border,
    borderColor: 'red',
  },
  cardContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    height: 200,
    width: 300,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    //borderWidth: border,
    borderColor: 'blue',
  },
  cardImage: {
    height: 120,
    width: 300,
    bottom: 0,
    position: 'absolute',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    //borderWidth: border,
    borderColor: 'green',
  },
  cardTitle: {
    color: 'white',
    fontSize: 26,
    alignSelf: 'center',
    textAlign: 'center',
    //borderWidth: border,
    borderColor: 'purple',
  },
  titleContainer: {
    position: 'absolute',
    height: 80,
    justifyContent: 'center',
    //borderWidth: border,
    borderColor: 'orange',
  }
});


// export default React.memo(Maps);

