import { gql } from '@apollo/client';

// ============ AUTH MUTATIONS ============

// Rider login mutation.
export const LOGIN_RIDER = gql`
  mutation LoginRider($email: EmailAddress!, $password: String!) {
    loginRider(input: { email: $email, password: $password }) {
      accessToken
      refreshToken
      rider {
        id
        name
      }
    }
  }
`;

// Rider refresh Access Token using Refresh Token mutation.
export const REFRESH_ACCESS_TOKEN_RIDER = gql`
  mutation RefreshAccessTokenRider {
    refreshAccessTokenRider {
      accessToken
      rider {
        id
        name
      }
    }
  }
`;

// Rider logout.
export const LOGOUT_RIDER = gql`
  mutation LogoutRider {
    logoutRider {
      message
    }
  }
`;

// Rider signup mutation.
export const SIGNUP_RIDER = gql`
  mutation SignupRider(
    $email: EmailAddress!
    $password: String!
    $name: String!
    $phoneNumber: String!
    $inviteCode: String
  ) {
    signupRider(
      input: {
        email: $email
        password: $password
        name: $name
        phoneNumber: $phoneNumber
        inviteCode: $inviteCode
      }
    ) {
      accessToken
      refreshToken
      rider {
        id
        name
      }
    }
  }
`;

// Driver login mutation.
export const LOGIN_DRIVER = gql`
  mutation LoginDriver($email: EmailAddress!, $password: String!) {
    loginDriver(input: { email: $email, password: $password }) {
      accessToken
      refreshToken
      driver {
        id
        name
      }
    }
  }
`;

// Driver refresh Access Token using Refresh Token mutation.
export const REFRESH_ACCESS_TOKEN_DRIVER = gql`
  mutation RefreshAccessTokenDriver {
    refreshAccessTokenDriver {
      accessToken
      driver {
        id
        name
      }
    }
  }
`;

// Driver logout.
export const LOGOUT_DRIVER = gql`
  mutation LogoutDriver {
    logoutDriver {
      message
    }
  }
`;

// ============ RIDER MUTATIONS ============

// Update rider.
export const UPDATE_RIDER = gql`
  mutation UpdateRider(
    $id: ID!
    $email: EmailAddress
    $name: String
    $phoneNumber: String
    $currentRideId: ID
    $completedRides: Int
    $homeAddress: String
    $workAddress: String
    $profilePicture: String
  ) {
    updateRider(
      id: $id
      email: $email
      name: $name
      phoneNumber: $phoneNumber
      currentRideId: $currentRideId
      completedRides: $completedRides
      homeAddress: $homeAddress
      workAddress: $workAddress
      profilePicture: $profilePicture
    ) {
      id
      email
      name
      phoneNumber
      currentRideId
      completedRides
      homeAddress
      workAddress
      profilePicture
    }
  }
`;

// Add a favorite driver to a rider.
export const ADD_FAVORITE_DRIVER = gql`
  mutation AddFavoriteDriver($riderId: ID!, $driverId: ID!) {
    addFavoriteDriver(riderId: $riderId, driverId: $driverId) {
      id
      email
      name
      phoneNumber
      currentRideId
      completedRides
      homeAddress
    }
  }
`;

// Remove a favorite driver from a rider.
export const REMOVE_FAVORITE_DRIVER = gql`
  mutation RemoveFavoriteDriver($riderId: ID!, $driverId: ID!) {
    removeFavoriteDriver(riderId: $riderId, driverId: $driverId) {
      id
      email
      name
      phoneNumber
      currentRideId
      completedRides
      homeAddress
    }
  }
`;

// Reset rider's ride flow status to NONE.
export const RESET_RIDER_RIDE_FLOW_STATUS = gql`
  mutation ResetRiderRideFlowStatus($id: ID!) {
    resetRiderRideFlowStatus(id: $id) {
      id
      rideFlowStatus
    }
  }
`;

// ============ DRIVER MUTATIONS ============

// Update driver.
export const UPDATE_DRIVER = gql`
  mutation UpdateDriver(
    $id: ID!
    $email: EmailAddress
    $name: String
    $phoneNumber: String
    $licensePlate: String
    $carMake: String
    $carModel: String
    $carColor: String
    $isOnDuty: Boolean
    $currentRideId: ID
    $riderQueue: Int
    $driverNextAvailableAt: Long
    $profilePicture: String
    $seats: Int
  ) {
    updateDriver(
      id: $id
      email: $email
      name: $name
      phoneNumber: $phoneNumber
      licensePlate: $licensePlate
      carMake: $carMake
      carModel: $carModel
      carColor: $carColor
      isOnDuty: $isOnDuty
      currentRideId: $currentRideId
      riderQueue: $riderQueue
      driverNextAvailableAt: $driverNextAvailableAt
      profilePicture: $profilePicture
      seats: $seats
    ) {
      id
      email
      name
      phoneNumber
      licensePlate
      carMake
      carModel
      carColor
      isOnDuty
      currentRideId
      riderQueue
      driverNextAvailableAt
      profilePicture
      seats
      createdAt
      updatedAt
    }
  }
`;

// Update driver's duty status.
export const UPDATE_DRIVER_IS_ON_DUTY = gql`
  mutation UpdateDriverDutyStatus($id: ID!, $isOnDuty: Boolean!) {
    updateDriverIsOnDuty(id: $id, isOnDuty: $isOnDuty) {
      isOnDuty
    }
  }
`;

// Update driver's next available time.
export const UPDATE_DRIVER_NEXT_AVAILABLE_AT = gql`
  mutation UpdateDriverNextAvailableAt(
    $id: ID!
    $riderQueueChange: Int!
    $secondsToAdd: Int!
  ) {
    updateDriverNextAvailableAt(
      id: $id
      riderQueueChange: $riderQueueChange
      secondsToAdd: $secondsToAdd
    ) {
      riderQueue
      driverNextAvailableAt
    }
  }
`;

// ============ RIDE MUTATIONS ============

// Create ride.
// Register the device's Expo push token against the logged-in rider.
// Pass `expoPushToken: null` to clear it (e.g. permission revoked).
export const REGISTER_RIDER_PUSH_TOKEN = gql`
  mutation RegisterRiderPushToken($riderId: ID!, $expoPushToken: String) {
    registerRiderPushToken(riderId: $riderId, expoPushToken: $expoPushToken) {
      message
    }
  }
`;

// Same as above, for drivers (notification on new ride requests).
export const REGISTER_DRIVER_PUSH_TOKEN = gql`
  mutation RegisterDriverPushToken($driverId: ID!, $expoPushToken: String) {
    registerDriverPushToken(driverId: $driverId, expoPushToken: $expoPushToken) {
      message
    }
  }
`;

export const CREATE_RIDE = gql`
  mutation CreateRide(
    $riderId: ID
    $riderName: String!
    $phoneNumber: String!
    $passengers: Int!
    $pickUp: String!
    $pickUpLat: Float
    $pickUpLng: Float
    $dropOff: String!
    $dropOffLat: Float
    $dropOffLng: Float
    $pickUpTime: String!
    $bidAmount: Int
    $requestedDriverIds: [ID]
  ) {
    createRide(
      riderId: $riderId
      riderName: $riderName
      phoneNumber: $phoneNumber
      passengers: $passengers
      pickUp: $pickUp
      pickUpLat: $pickUpLat
      pickUpLng: $pickUpLng
      dropOff: $dropOff
      dropOffLat: $dropOffLat
      dropOffLng: $dropOffLng
      pickUpTime: $pickUpTime
      bidAmount: $bidAmount
      requestedDriverIds: $requestedDriverIds
    ) {
      id
      riderId
      riderName
      phoneNumber
      passengers
      pickUp
      pickUpLat
      pickUpLng
      dropOff
      dropOffLat
      dropOffLng
      pickUpTime
      date
      bidAmount
      requestedDriverIds
      driverId
      driverName
      isRequested
      isAccepted
      isCanceled
      isCompleted
      isExpired
      completedAt
      expiredAt
    }
  }
`;

// Update ride status (ride flow state).
export const UPDATE_RIDE_STATUS = gql`
  mutation UpdateRideStatus(
    $id: ID!
    $driverId: ID
    $driverName: String
    $isRequested: Boolean!
    $isAccepted: Boolean!
    $isCanceled: Boolean!
    $isCompleted: Boolean!
    $isExpired: Boolean!
    $canceledBy: CanceledBy
  ) {
    updateRideStatus(
      id: $id
      driverId: $driverId
      driverName: $driverName
      isRequested: $isRequested
      isAccepted: $isAccepted
      isCanceled: $isCanceled
      isCompleted: $isCompleted
      isExpired: $isExpired
      canceledBy: $canceledBy
    ) {
      id
      driverId
      driverName
      isRequested
      isAccepted
      isCanceled
      isCompleted
      isExpired
      canceledBy
    }
  }
`;

// ============ INVITE MUTATIONS ============

// Generate invite code for a driver.
export const GENERATE_INVITE_CODE = gql`
  mutation GenerateInviteCode($driverId: ID!) {
    generateInviteCode(driverId: $driverId) {
      id
      code
      driverId
      usageCount
      createdAt
    }
  }
`;

// ============ PASSWORD RESET ============
// Requests a reset email. The backend returns the same message whether or not
// the account exists (anti-enumeration). The emailed link opens the web reset
// page, which is where the new password is actually set.

export const FORGOT_PASSWORD_RIDER = gql`
  mutation ForgotPasswordRider($email: EmailAddress!) {
    forgotPasswordRider(email: $email) {
      message
    }
  }
`;

export const FORGOT_PASSWORD_DRIVER = gql`
  mutation ForgotPasswordDriver($email: EmailAddress!) {
    forgotPasswordDriver(email: $email) {
      message
    }
  }
`;

// Driver's live position while on duty (foreground only). Riders with an
// active ride with this driver receive it via driverLocationUpdated.
export const UPDATE_DRIVER_LOCATION = gql`
  mutation UpdateDriverLocation($id: ID!, $latitude: Float!, $longitude: Float!) {
    updateDriverLocation(id: $id, latitude: $latitude, longitude: $longitude) {
      id
      latitude
      longitude
    }
  }
`;
