import { gql } from '@apollo/client';

// ============ DRIVER SUBSCRIPTIONS ============

// Driver updates subscription.
export const DRIVER_UPDATES = gql`
  subscription DriverUpdates {
    driverUpdates {
      mutationType
      driver {
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
        createdAt
        updatedAt
      }
    }
  }
`;

// Driver's duty status update subscription.
export const DRIVER_DUTY_STATUS_UPDATES = gql`
  subscription DriverDutyStatusUpdates {
    driverDutyStatusUpdates {
      id
      isOnDuty
    }
  }
`;

// Driver's availability update subscription.
export const DRIVER_AVAILABILITY_UPDATES = gql`
  subscription DriverAvailabilityUpdates {
    driverAvailabilityUpdates {
      id
      riderQueue
      driverNextAvailableAt
    }
  }
`;

// ============ RIDE SUBSCRIPTIONS ============

// Subscription for when a new ride is created.
export const RIDE_CREATED = gql`
  subscription RideCreated($driverId: Int!) {
    rideCreated(driverId: $driverId) {
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
      waitingTime
      driverId
      driverName
      isRequested
      isAccepted
      isCanceled
      isCompleted
      isExpired
      canceledAt
      completedAt
      expiredAt
      createdAt
      updatedAt
    }
  }
`;

// Subscription for when ride details are updated.
export const RIDE_DETAILS_UPDATED = gql`
  subscription RideDetailsUpdated {
    rideDetailsUpdated {
      id
      riderId
      riderName
      phoneNumber
      passengers
      pickUp
      dropOff
      pickUpTime
      bidAmount
      waitingTime
    }
  }
`;

// Subscription for when a ride is accepted by a driver.
export const RIDE_ACCEPTED = gql`
  subscription RideAccepted {
    rideAccepted {
      id
      riderId
      riderName
      driverId
      driverName
      isAccepted
      pickUp
      dropOff
    }
  }
`;

// Subscription for when a ride is canceled.
export const RIDE_CANCELED = gql`
  subscription RideCanceled {
    rideCanceled {
      ride {
        id
        riderId
        riderName
        driverId
        driverName
        isCanceled
        canceledAt
      }
      canceledBy
    }
  }
`;

// Subscription for when a ride is completed.
export const RIDE_COMPLETED = gql`
  subscription RideCompleted {
    rideCompleted {
      id
      riderId
      riderName
      driverId
      driverName
      isCompleted
      completedAt
    }
  }
`;

// Subscription for when a ride expires.
export const RIDE_EXPIRED = gql`
  subscription RideExpired {
    rideExpired {
      id
      riderId
      riderName
      isExpired
      expiredAt
    }
  }
`;
