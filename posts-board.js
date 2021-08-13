window.addEventListener("load", function() {

    fetchProjects();

    function fetchProjects() {
        fetch("./projects.json")
            .then(response => response.json())
            .then(data => {
                initBoard(data);
            })
            .catch(error => console.log(error));
    }

    function initBoard(projects) {
        var boardSelects = document.querySelectorAll(".board-select");
        var projectsList = document.querySelector(".projects-container");

        boardSelects.forEach(select => {
            select.addEventListener("change", function() {
                getBoardFilters(projects);
            });
        });

        projects.forEach(project => {
            var projectContainer = document.createElement("div");
            projectContainer.className = "project-container";

            for(var prop in project) {
                var p = document.createElement("p");
                var b = document.createElement("b");
                var bText = document.createTextNode(dummySpanishTranslate(prop).toUpperCase() + ": ");
                var restOfText = "";
                if(typeof project[prop] == "object") {
                    if(Array.isArray(project[prop])) {
                        project[prop].forEach((key, kIndex) => {
                            restOfText += kIndex == project[prop].length - 1 ? key.title : key.title + ", ";
                        });
                    } else {
                        restOfText = project[prop].title;
                    }
                } else {
                    restOfText = project[prop];
                }
                var pText = document.createTextNode(restOfText);
                b.appendChild(bText);
                p.appendChild(b);
                p.appendChild(pText);

                projectContainer.appendChild(p);
                //console.log(prop + ": " + typeof project[prop]);
            }

            projectsList.appendChild(projectContainer);
        });

        getBoardFilters(projects);
    }

    function getBoardFilters(projects) {
        var boardContainer = document.querySelector("#board-container");
        var columnsSelect = document.querySelector("#select-columns");
        var rowsSelect = document.querySelector("#select-rows");

        boardContainer.innerHTML = "";

        // get selected board filters
        var columnsFilter = columnsSelect.value;
        var rowsFilter = rowsSelect.value;

        if(columnsFilter != rowsFilter) fetchFilters(columnsFilter, rowsFilter, projects);
    }

    function fetchFilters(columns, rows, projects) {
        var boardSelects = document.querySelectorAll(".board-select");
        boardSelects.forEach(select => {
            select.disabled = true;
        });

        Promise.all([
            fetch("./" + columns + ".json"),
            fetch("./" + rows + ".json")
        ])
            .then(responses => {
                return Promise.all(responses.map(response => response.json()));
            })
            .then(data => {
                boardSelects.forEach(select => {
                    select.disabled = false;
                });

                setBoard(data[0], data[1], projects, {col: columns, row: rows});
            })
            .catch(error => console.log(error));
    }

    function setBoard(columns, rows, projects, filters) {
        var boardContainer = document.querySelector("#board-container");

        var columnsHeader = getBoardRow(false);
        columns.forEach(column => {
            var columnHeader = getBoardCell(column.title, true);
            columnsHeader.appendChild(columnHeader);
        });
        boardContainer.appendChild(columnsHeader);

        rows.forEach((row, rIndex) => {
            var currentRow = getBoardRow(row.title);

            columns.forEach((col, cIndex) => {
                var matchProjects = projects.filter(project => {
                    /* if("topics" === filters.col) {
                        var foundTopics = project.topics.filter(topic => topic.id == col.id);
                        return project[filters.row].id == row.id && foundTopics.length > 0 ? true : false;
                    } else if("topics" === filters.row) {
                        var foundTopics = project.topics.filter(topic => topic.id == row.id);
                        return foundTopics.length > 0 && project[filters.col].id == col.id ? true : false;
                    } else {
                        return project[filters.row].id == row.id && project[filters.col].id == col.id ? true : false;
                    } */
                    var colArray = Array.isArray(project[filters.col]) ? project[filters.col] : [project[filters.col]];
                    var rowArray = Array.isArray(project[filters.row]) ? project[filters.row] : [project[filters.row]];
                    var foundColFilter = colArray.filter(key => key.id == col.id);
                    var foundRowFilter = rowArray.filter(key => key.id == row.id);

                    return foundColFilter.length > 0 && foundRowFilter.length > 0 ? true : false;
                });

                var currentCell = matchProjects.length > 0 ? getBoardCell(matchProjects, false) : getBoardCell(false, false);
                currentRow.appendChild(currentCell);
            });

            boardContainer.appendChild(currentRow);
        });
    }

    function getBoardRow(header) {
        var row = document.createElement("div");
        row.className = header ? "board-row row-projects" : "board-row header-column";

        var firstCell = header ? getBoardCell(header, true) : getBoardCell(false, true);
        row.appendChild(firstCell);

        return row;
    }

    function getBoardCell(data, isHeader) {
        var cell = document.createElement("div");
        cell.className = isHeader ? "board-header" : "board-cell";
        if(data) {
            if(isHeader) {
                var headerTitle = document.createElement("h2");
                var headerText = document.createTextNode(data);
                headerTitle.appendChild(headerText);
                cell.appendChild(headerTitle);
            } else {
                data.forEach((project, pIndex) => {
                    var cellProject = document.createElement("div");
                    cellProject.className = pIndex == 0 ? "cell-project active-project" : "cell-project";
                    var projectTitle = document.createElement("p");
                    var titleText = document.createTextNode(project.title);
                    projectTitle.appendChild(titleText);
                    cellProject.appendChild(projectTitle);

                    cell.appendChild(cellProject);

                });
                var projectCounter = document.createElement("div");
                projectCounter.className = "cell-counter";
                projectCounter.textContent = "1/" + data.length;
                
                cell.appendChild(projectCounter);
                
                // * EXAMPLE ONLY
                if(data.length > 1) {
                    cell.setAttribute("data-project-index", "0");
                    cell.addEventListener("click", function() {
                        var projectIndex = parseInt(cell.getAttribute("data-project-index"));
                        var currentProject = cell.querySelector(".active-project");
                        var cellCounter = cell.querySelector(".cell-counter");
                        var totalProjects = cell.querySelectorAll(".cell-project").length;
    
                        projectIndex++;
                        if(projectIndex >= totalProjects) projectIndex = 0;
                        currentProject.className = currentProject.className.replace(" active-project", "");
                        cell.children[projectIndex].className += " active-project";
                        cellCounter.textContent = (projectIndex + 1) + "/" + totalProjects;
                        cell.setAttribute("data-project-index", "" + projectIndex);
                    });
                }
            }
        } else {
            cell.className += " no-cell";
        }

        return cell;
    }

    function dummySpanishTranslate(word) {
        var translated = "";
        switch(word) {
            case "title":
                translated = "titulo";
                break;
            case "customers":
                translated = "clientes";
                break;
            case "topics":
                translated = "temas";
                break;
            case "services":
                translated = "servicios";
                break;
            case "decalogue":
                translated = "decalogo";
                break;
        }

        return translated ? translated : word;
    }

});