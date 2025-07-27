function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className = "footer">
            <div className = "footerContainer">
                <div className = "footerContent">
                    <div className = "footerSection">
                        <h4>GPA Tracker</h4>
                        <p>This project is created as a way for me to learn to develop an app, while creating an app that helps people track their grades conveniently and easily!</p>
                        <a 
                            href = "https://docs.google.com/forms/d/e/1FAIpQLScYloRTk6SdiJXihhkG4G3-ptO4fLIIEZM8R8ka5FLFhgxsPw/viewform?usp=sharing&ouid=110800526281614307267"
                            target = "_blank" rel = "noopener noreferrer" className = "footerLink">
                                Feedback Form
                        </a>
                    </div>

                    <div className = "footerSection">
                        <h4>Developer</h4>
                        <p>Created by Ujjwal Raghuvanshi</p>
                    </div>

                    <div className = "footerSection">
                        <h4>Contact Information</h4>
                        <div className = "contactLinks">
                            <a href = "mailto:ujjwal.raghuvanshi2005@gmail.com" className = "footerLink">
                                Email
                            </a>
                            <a href = "https://github.com/MetaZoan1" target = "_blank" rel = "noopener noreferrer" className = "footerLink">
                                Github
                            </a>
                            <a href = "https://linkedin.com/in/ujjwal-raghuvanshi-4970a8353/" target = "_blank" rel = "noopener noreferrer" className = "footerLink">
                                LinkedIn
                            </a>
                        </div>
                    </div>
                </div>

                <div className = "footerBottom">
                    <p>&copy; {currentYear} GPA Tracker. Built with React and Node.js</p>
                </div>
            </div>
        </footer>
    )
    
}

export default Footer;