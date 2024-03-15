import { defineStore } from 'pinia'
import { getRobot, setRobot, removeRobot } from './helper'
import type { RobotInfo } from './helper'

export const useRobotStore = defineStore('robot-store', {
  state: (): RobotInfo => getRobot(),

  getters: {

  },
  actions: {
    setRobot(info: RobotInfo) {
      setRobot(info)
    },
    removeRobot() {
      removeRobot()
    },
  },
})

