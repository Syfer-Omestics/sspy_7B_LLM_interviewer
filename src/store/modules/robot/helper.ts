import { ss } from '@/utils/storage'

const LOCAL_NAME = 'ROBOT_INFO'

export interface RobotInfo {
  rid: string,
  rtoken: string,
  rname: string,
  rtype: string
}

export function getRobot() {
  return ss.get(LOCAL_NAME)
}

export function setRobot(info: RobotInfo) {
  return ss.set(LOCAL_NAME, info)
}

export function removeRobot() {
  return ss.remove(LOCAL_NAME)
}
