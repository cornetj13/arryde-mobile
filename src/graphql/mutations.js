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

// Create rider.
export const CREATE_RIDER = gql`
  mutation CreateRider(
    $email: EmailAddress!
    $password: String!
    $name: String!
    $phoneNumber: String!
  ) {
    createRider(
      email: $email
      password: $password
      name: $name
      phoneNumber: $phoneNumber
    ) {
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

// Delete rider.
export const DELETE_RIDER = gql`
  mutation DeleteRider($id: ID!) {
    deleteRider(id: $id) {
      message
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

// Create driver.
export const CREATE_DRIVER = gql`
  mutation CreateDriver(
    $email: EmailAddress!
    $password: String!
    $name: String!
    $phoneNumber: String!
  ) {
    createDriver(
      email: $email
      password: $password
      name: $name
      phoneNumber: $phoneNumber
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
    }
  }
`;

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
    $driverNextAvailableAt: Int
    $profilePicture: String
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
      createdAt
      updatedAt
    }
  }
`;

// Delete driver.
export const DELETE_DRIVER = gql`
  mutation DeleteDriver($id: ID!) {
    deleteDriver(id: $id) {
      message
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
export const CREATE_RIDE = gql`
  mutation CreateRide(
    $riderId: ID
    $riderName: String!
    $phoneNumber: String!
    $passengers: Int!
    $pickUp: String!
    $dropOff: String!
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
      dropOff: $dropOff
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
      dropOff
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

// Update ride (details about ride).
export const UPDATE_RIDE = gql`
  mutation UpdateRide(
    $id: ID!
    $riderId: ID
    $riderName: String
    $phoneNumber: String
    $passengers: Int
    $pickUp: String
    $dropOff: String
    $pickUpTime: String
    $bidAmount: Int
    $requestedDriverIds: [ID]
    $driverId: ID
    $driverName: String
  ) {
    updateRide(
      id: $id
      riderId: $riderId
      riderName: $riderName
      phoneNumber: $phoneNumber
      passengers: $passengers
      pickUp: $pickUp
      dropOff: $dropOff
      pickUpTime: $pickUpTime
      bidAmount: $bidAmount
      requestedDriverIds: $requestedDriverIds
      driverId: $driverId
      driverName: $driverName
    ) {
      id
      riderId
      riderName
      phoneNumber
      passengers
      pickUp
      dropOff
      pickUpTime
      date
      bidAmount
      requestedDriverIds
      driverId
      driverName
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

// Delete ride.
export const DELETE_RIDE = gql`
  mutation DeleteRide($id: ID!) {
    deleteRide(id: $id) {
      message
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
