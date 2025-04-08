import Nav from '../components/Nav'
import {useState} from 'react'
import {useCookies} from 'react-cookie'
import {useNavigate} from 'react-router-dom'
import axios from 'axios'

const OnBoarding = () => {
    const [cookies, setCookie, removeCookie] = useCookies(null)
    const [formData, setFormData] = useState({
        user_id: cookies.UserId,
        first_name: "",
        dob_day: "",
        dob_month: "",
        dob_year: "",
        show_gender: false,
        gender_identity: "man",
        gender_interest: "woman",
        url: "",
        about: "",
        matches: []
    })
    const [imageFile, setImageFile] = useState(null)
    const [isUploading, setIsUploading] = useState(false)

    let navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsUploading(true)
        
        try {
            // Final form data to be sent to the backend
            const dataToSubmit = { ...formData }
            
            // Send the form data to the backend
            const response = await axios.put('http://localhost:8000/user', { formData: dataToSubmit })
            console.log(response)
            const success = response.status === 200
            if (success) navigate('/dashboard')
        } catch (err) {
            console.log(err)
            alert('Error submitting form. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleChange = (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
        const name = e.target.name

        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }))
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        
        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file (png, jpg, jpeg)')
            return
        }
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size should be less than 5MB')
            return
        }
        
        setImageFile(file)
        
        // Convert image to base64
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            setFormData(prevState => ({
                ...prevState,
                url: reader.result // Store base64 string in formData.url
            }))
        }
        reader.onerror = (error) => {
            console.log('Error: ', error)
            alert('Error reading file. Please try again.')
        }
    }

    const styles = {
        onboarding: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
        },
        form: {
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '1200px',
            flexWrap: 'wrap'
        },
        section: {
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            width: '35%',
            margin: '10px',
            border: '1px solid #ddd',
            borderRadius: '8px'
        },
        heading: {
            textAlign: 'center',
            margin: '20px 0',
            color: '#fe3072'
        },
        label: {
            margin: '10px 0 5px',
            fontWeight: 'bold'
        },
        input: {
            padding: '10px',
            margin: '5px 0',
            borderRadius: '5px',
            border: '1px solid #ddd'
        },
        multipleInputContainer: {
            display: 'flex',
            flexDirection: 'row',
            gap: '10px'
        },
        photoContainer: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '20px'
        },
        profileImage: {
            width: '200px',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '10px',
            marginTop: '10px'
        },
        uploadButton: {
            backgroundColor: '#fe3072',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '10px',
            position: 'relative',
            overflow: 'hidden'
        },
        fileInput: {
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer'
        },
        orText: {
            margin: '10px 0',
            textAlign: 'center',
            color: '#666'
        },
        submitButton: {
            backgroundColor: '#fe3072',
            color: 'white',
            padding: '12px',
            borderRadius: '5px',
            border: 'none',
            margin: '20px 0',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
        },
        disabled: {
            opacity: 0.5,
            cursor: 'not-allowed'
        },
        fileName: {
            marginTop: '5px',
            fontSize: '14px',
            color: '#333'
        }
    }

    return (
        <>
            <Nav
                minimal={true}
                setShowModal={() => {}}
                showModal={false}
            />

            <div style={styles.onboarding} className="onboarding">
                <h2 style={styles.heading}>CREATE ACCOUNT</h2>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        backgroundColor: '#fff',
                        color: '#fe3072',
                        border: '2px solid #fe3072',
                        padding: '8px 16px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginBottom: '20px',
                        fontWeight: 'bold'
                    }}
                >
                    ← Back to Home
                </button>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <section style={styles.section}>
                        <label style={styles.label} htmlFor="first_name">First Name</label>
                        <input
                            style={styles.input}
                            id="first_name"
                            type='text'
                            name="first_name"
                            placeholder="First Name"
                            required={true}
                            value={formData.first_name}
                            onChange={handleChange}
                        />

                        <label style={styles.label}>Birthday</label>
                        <div style={styles.multipleInputContainer} className="multiple-input-container">
                            <input
                                style={styles.input}
                                id="dob_day"
                                type="number"
                                name="dob_day"
                                placeholder="DD"
                                required={true}
                                value={formData.dob_day}
                                onChange={handleChange}
                            />

                            <input
                                style={styles.input}
                                id="dob_month"
                                type="number"
                                name="dob_month"
                                placeholder="MM"
                                required={true}
                                value={formData.dob_month}
                                onChange={handleChange}
                            />

                            <input
                                style={styles.input}
                                id="dob_year"
                                type="number"
                                name="dob_year"
                                placeholder="YYYY"
                                required={true}
                                value={formData.dob_year}
                                onChange={handleChange}
                            />
                        </div>

                        <label style={styles.label}>Gender</label>
                        <div style={styles.multipleInputContainer} className="multiple-input-container">
                            <input
                                id="man-gender-identity"
                                type="radio"
                                name="gender_identity"
                                value="man"
                                onChange={handleChange}
                                checked={formData.gender_identity === "man"}
                            />
                            <label htmlFor="man-gender-identity">Man</label>
                            <input
                                id="woman-gender-identity"
                                type="radio"
                                name="gender_identity"
                                value="woman"
                                onChange={handleChange}
                                checked={formData.gender_identity === "woman"}
                            />
                            <label htmlFor="woman-gender-identity">Woman</label>
                            <input
                                id="more-gender-identity"
                                type="radio"
                                name="gender_identity"
                                value="more"
                                onChange={handleChange}
                                checked={formData.gender_identity === "more"}
                            />
                            <label htmlFor="more-gender-identity">More</label>
                        </div>

                        <div className='show-gender-div'>
                        <label style={styles.label} htmlFor="show-gender">Show Gender on my Profile</label>
                                <input
                                id="show-gender"
                                type="checkbox"
                                name="show_gender"
                                onChange={handleChange}
                                checked={formData.show_gender}
                            />
                        </div>

                        <label style={styles.label}>Show Me</label>

                        <div style={styles.multipleInputContainer} className="multiple-input-container">
                            <input
                                id="man-gender-interest"
                                type="radio"
                                name="gender_interest"
                                value="man"
                                onChange={handleChange}
                                checked={formData.gender_interest === "man"}
                            />
                            <label htmlFor="man-gender-interest">Man</label>
                            <input
                                id="woman-gender-interest"
                                type="radio"
                                name="gender_interest"
                                value="woman"
                                onChange={handleChange}
                                checked={formData.gender_interest === "woman"}
                            />
                            <label htmlFor="woman-gender-interest">Woman</label>
                            <input
                                id="everyone-gender-interest"
                                type="radio"
                                name="gender_interest"
                                value="everyone"
                                onChange={handleChange}
                                checked={formData.gender_interest === "everyone"}
                            />
                            <label htmlFor="everyone-gender-interest">Everyone</label>
                        </div>

                        <label style={styles.label} htmlFor="about">About me</label>
                        <input
                            style={styles.input}
                            id="about"
                            type="text"
                            name="about"
                            required={true}
                            placeholder="I like long walks..."
                            value={formData.about}
                            onChange={handleChange}
                        />

                        <button 
                            style={isUploading ? {...styles.submitButton, ...styles.disabled} : styles.submitButton} 
                            type="submit"
                            disabled={isUploading}
                        >
                            {isUploading ? 'Submitting...' : 'Submit'}
                        </button>
                    </section>

                    

                    <section style={styles.section}>
                        <label style={styles.label}>Profile Photo</label>
                        
                        <div style={styles.photoContainer} className="photo-container">
                            {/* File Upload Button */}
                            <div style={styles.uploadButton}>
                                Upload Image
                                <input
                                    style={styles.fileInput}
                                    type="file"
                                    id="profile-image"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            
                            {/* Show file name if selected */}
                            {imageFile && (
                                <div style={styles.fileName}>
                                    Selected: {imageFile.name}
                                </div>
                            )}
                            
                            <p style={styles.orText}>OR</p>
                            
                            {/* URL Input */}
                            <label style={styles.label} htmlFor="url">Provide Image URL</label>
                            <input
                                style={styles.input}
                                type="url"
                                name="url"
                                id="url"
                                placeholder="https://example.com/your-image.jpg"
                                value={formData.url.startsWith('data:') ? '' : formData.url}
                                onChange={handleChange}
                            />
                            
                            {/* Image Preview */}
                            {formData.url && (
                                <img 
                                    src={formData.url} 
                                    alt="Profile preview" 
                                    style={styles.profileImage}
                                />
                            )}
                        </div>
                    </section>
                </form>
            </div>
        </>
    )
}

export default OnBoarding