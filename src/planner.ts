import { Weekdays, DayCols, WEEKDAY_STRINGS, isSameDay, findFirstPrecedingDay } from "./utils"
import { Task, TaskView } from "./task"
import { TaskManager } from "./main"

/**
 * The TaskView that represents the Planner tab.
 */
export class Planner implements TaskView {
    private startDate: Date
    private taskMgr: TaskManager

    private startDay: Weekdays

    private dayColumns: DayColumn[] = []

    constructor(taskMgr: TaskManager, startDay: Weekdays = Weekdays.sunday) {
        this.taskMgr = taskMgr
        this.startDay = startDay

        var today = new Date()
        this.startDate = findFirstPrecedingDay(today, startDay)

        for (let i = 0; i < 7; i++) {
            this.dayColumns.push(new DayColumn(this.taskMgr, today))
        }

        document.getElementById("planneryesterday")!.addEventListener(
            "click",
            (_) => this.shiftLeft(1)
        )

        document.getElementById("plannernextweek")!.addEventListener(
            "click",
            (_) => this.shiftRight(7)
        )

        document.getElementById("plannerlastweek")!.addEventListener(
            "click",
            (_) => this.shiftLeft(7)
        )

        document.getElementById("plannertomorrow")!.addEventListener(
            "click",
            (_) => this.shiftRight(1)
        )

        document.getElementById("plannerthisweek")!.addEventListener(
            "click",
            (_) => this.centerThisWeek()
        )
    }

    private shiftLeft(nDays: number) {
        this.startDate = new Date(this.startDate.valueOf() - nDays * 86_400_000)
        this.render()
    }

    private shiftRight(nDays: number) {
        this.startDate = new Date(this.startDate.valueOf() + nDays * 86_400_000)
        this.render()
    }

    private centerThisWeek() {
        var today = new Date()
        this.startDate = findFirstPrecedingDay(today, this.startDay)
        this.render()
    }

    render() {
        var date = new Date(this.startDate.valueOf())
        for (let index = 0; index < this.dayColumns.length; index++) {
            const col = this.dayColumns[index];
            col.date = date
            date = new Date(date.valueOf() + 86_400_000)
        }

        var differentYears = this.startDate.getFullYear() != date.getFullYear()

        document.getElementById("plannerdaterange")!.innerHTML = `${this.startDate.getMonth() + 1}/${this.startDate.getDate() + 1}${differentYears ? `/${this.startDate.getFullYear()}` : ""} – ${date.getMonth() + 1}/${date.getDate()}${differentYears ? `/${date.getFullYear()}` : ""}`
    }

    refresh() {
        for (let index = 0; index < this.dayColumns.length; index++) {
            const col = this.dayColumns[index];
            col.refresh()
        }
    }

    addTask(task: Task) {
        for (let index = 0; index < this.dayColumns.length; index++) {
            const col = this.dayColumns[index];
            if (isSameDay(col.date, task.due)) {
                col.addTask(task)
                return
            }
        }
    }
}

/**
 * Represents the Planner's Day Columns. This View handles rendering and
 * displaying the day's tasks.
 */
class DayColumn implements TaskView {
    private taskMgr: TaskManager
    private _date: Date

    get date(): Date {
        return new Date(this._date)
    }

    set date(value: Date) {
        this._date = value
        this.render()
    }

    private element: HTMLDivElement

    constructor(taskMgr: TaskManager, date: Date) {
        this.taskMgr = taskMgr
        this._date = date

        this.element = document.createElement("div")
        this.element.className = "daycolumn"
        this.element.id = DayCols[date.getDay()]

        var container = document.getElementsByClassName("plannercontainer")[0]
        container.appendChild(this.element)
    }

    addTask(task: Task) {
        this.element.appendChild(task.getPlannerElement())
    }

    render() {
        this.element.innerHTML = ""

        var heading = document.createElement("h4")
        heading.innerHTML = WEEKDAY_STRINGS[this._date.getDay()]
        this.element.appendChild(heading)

        var dateHeading = document.createElement("h5")
        dateHeading.innerHTML = `${this.date.getMonth() + 1}/${this.date.getDate()}`
        this.element.appendChild(dateHeading)

        this.element.appendChild(document.createElement("div"))

        var tasks = this.taskMgr.getTasks().filter((t) => {
            return isSameDay(this._date, t.due) && !t.deleted
        }, this)
        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];
            this.element.appendChild(task.getPlannerElement())
        }

        this.refresh()
    }

    refresh() {
        if (isSameDay(new Date(), this._date)) {
            this.element.className = "daycolumn today"
        } else {
            this.element.className = "daycolumn"
        }
    }
}

export function addPlannerTask(task: HTMLElement, dayId: string) {
    const day = document.getElementById(dayId)
    day?.appendChild(task)
}

export function switchPlannerOrientation(): boolean {
    var previousElement = document.getElementById("plannervertical")
    if (previousElement != null) {
        previousElement.remove()
        return false
    }
    var newElement = document.createElement("style")
    newElement.id = "plannervertical"
    newElement.innerHTML = `
    .plannercontainer {
        flex-direction: column;
    }
    
    .daycolumn {
        flex-grow: 1;
        width: unset;
        min-height: unset;
        margin-bottom: 1.25rem;
    
        column-count: 2;
    }
    
    .daycolumn h4 {
        text-align: left;
    }

    .daycolumn h5 {
        text-align: left;
    }
    
    `
    document.head.appendChild(newElement)
    return true
}

