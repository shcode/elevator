/*
 * Available information:
 * 1. Request queue
 * Simulator.get_instance().get_requests()
 * Array of integers representing floors where there are people calling the elevator
 * eg: [7,3,2] // There are 3 people waiting for the elevator at floor 7,3, and 2, in that order
 * 
 * 2. Elevator object
 * To get all elevators, Simulator.get_instance().get_building().get_elevator_system().get_elevators()
 * Array of Elevator objects.
 * - Current floor
 * elevator.at_floor()
 * Returns undefined if it is moving and returns the floor if it is waiting.
 * - Destination floor
 * elevator.get_destination_floor()
 * The floor the elevator is moving toward.
 * - Position
 * elevator.get_position()
 * Position of the elevator in y-axis. Not necessarily an integer.
 * - Elevator people
 * elevator.get_people()
 * Array of people inside the elevator
 * 
 * 3. Person object
 * - Floor
 * person.get_floor()
 * - Destination
 * person.get_destination_floor()
 * - Get time waiting for an elevator
 * person.get_wait_time_out_elevator()
 * - Get time waiting in an elevator
 * person.get_wait_time_in_elevator()
 * 
 * 4. Time counter
 * Simulator.get_instance().get_time_counter()
 * An integer increasing by 1 on every simulation iteration
 * 
 * 5. Building
 * Simulator.get_instance().get_building()
 * - Number of floors
 * building.get_num_floors()
 */

Array.prototype.lower = function(exact_floor) {
    return this.filter(function(floor) {
        return floor <= exact_floor;
    })
}

Array.prototype.upper = function(exact_floor) {
    return this.filter(function(floor){
        return floor >= exact_floor;
    })
}

Elevator.prototype.decide = function() {
    var simulator = Simulator.get_instance();
    var building = simulator.get_building();
    var num_floors = building.get_num_floors();
    var elevators = Simulator.get_instance().get_building().get_elevator_system().get_elevators();
    var time_counter = simulator.get_time_counter();
    var requests = simulator.get_requests();

    var elevator = this;
    var people = this.get_people();
    var exact_floor = Math.floor(elevator.get_position()/elevator.get_height()) + 1

    descending = function(a, b) {
        return b - a;
    }

    ascending = function(a, b) {
        return a - b;
    }

    allow_handle = function(floor, destinations) {
        var handled = false;
        // check the next stop, skip if it already handled or not destination of people
        for (j = 0; j < elevators.length; j++) {
            if (elevators[j].get_destination_floor() == floor && destinations.indexOf(floor) === -1) {
                handled = true;
            }
        }

        if (!handled) {
            return true;
        }
        return false;
    }

    get_destination = function(elevator, requests, destinations) {
        // filter only upper floor
        upper_floor = requests.upper(exact_floor);
        upper_floor.sort(ascending);
        // filter only lower floor
        lower_floor = requests.lower(exact_floor);
        lower_floor.sort(descending);
        
        if (elevator.direction == Elevator.DIRECTION_DOWN) {
            // if there are request / destination to lower floor
            if (lower_floor.length > 0) {
                for(var i = 0; i < lower_floor.length; i++) {
                    if (allow_handle(lower_floor[i], destinations)) {
                        return lower_floor[i];
                    }
                }
            } 

            elevator.direction = Elevator.DIRECTION_UP;
            for(var i = 0; i < upper_floor.length; i++){
                if (allow_handle(upper_floor[i], destinations)) {
                    return upper_floor[i];
                }
            }
        } else {
            // if there are request / destination to upper floor
            if (upper_floor.length > 0) {
                for(var i = 0; i < upper_floor.length; i++){
                    if (allow_handle(upper_floor[i], destinations)) {
                        return upper_floor[i];
                    }
                }
            }
            // if not, change direction
            elevator.direction = Elevator.DIRECTION_DOWN;
            for(var i = 0; i < lower_floor.length; i++){
                if (allow_handle(lower_floor[i], destinations)) {
                    return lower_floor[i];
                }
            }
        }
    }


    if (elevator) {
        // get people destination
        var destinations = [];
        for (var k = 0; k < people.length; k++ ) {
            destinations.push(people[k].get_destination_floor());
        }

        // combine people destination with requests
        var all_requests = requests.concat(destinations);
        all_requests = all_requests.filter(function (item, pos) {return all_requests.indexOf(item) == pos});

        // get nearest destination
        var destination = get_destination(elevator, all_requests, destinations);
        if (destination !== undefined) {
            return elevator.commit_decision(destination);
        }
    }

    // init, no people
    if (people == 0) {
        for (var i = 0; i < requests.length; i++) {
            var handled = false;
            for (var j = 0; j < elevators.length; j++) {
                if (elevators[j].get_destination_floor() == requests[i]) {
                    handled = true;
                    break;
                }
            }
            if (!handled) {
                elevator.direction = exact_floor < elevator.get_destination_floor() ? Elevator.DIRECTION_UP : Elevator.DIRECTION_DOWN;
                return this.commit_decision(requests[i]);
            }
        }
    }

    return this.commit_decision(Math.floor(num_floors / 2));
};
